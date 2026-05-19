import express from "express";
import bcrypt from "bcrypt";
import db from "./db.js";
import cors from "cors";
import * as jose from "jose";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import {
    authProtectedMiddleware,
    authPublicMiddleware,
} from "./middleware/auth.js";
import { v6 as uuidv6 } from "uuid";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:3001"],
    },
});
const port = 3000;
const saltRounds = 10;
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);

// use middleware
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:3001",
    }),
);
app.use(cookieParser());

// api requests
app.get("/", (req, res) => {
    res.send("lmaoooooooo");
});

app.get("/me", authProtectedMiddleware, (req, res) => {
    if (req.user) {
        return res.json(req.user);
    }
    res.status(401).json({
        msg: "Unauthorized",
    });
});

app.get("/logout", authProtectedMiddleware, (req, res) => {
    res.clearCookie("accessToken");
    return res.status(200).json({
        msg: "Logged out successfully",
    });
});

app.post("/register", authPublicMiddleware, (req, res) => {
    if (!req.body) return res.status(400).send("No req body");
    const { username, password } = req.body;
    const rows = db
        .prepare(`SELECT * FROM users WHERE username = ?`)
        .get(username);
    if (rows) return res.status(400).send("Username already exists");
    bcrypt.hash(password, saltRounds, (err, hashed) => {
        if (err) return res.status(500).send(err);
        db.prepare(`INSERT INTO users(username, password) VALUES (?, ?)`).run(
            username,
            hashed,
        );
        res.send("User registered successfully");
    });
});

app.post("/login", authPublicMiddleware, (req, res) => {
    if (req.user) return res.status(400).send("Already logged in");
    const { username, password } = req.body;
    const rows = db
        .prepare(`SELECT * FROM users WHERE username = ?`)
        .get(username);

    if (!rows) res.status(400).send("Username does not exist");

    bcrypt.compare(password, rows.password, async (err, result) => {
        if (err) return res.status(500).send(err);
        if (!result) return res.status(400).send("Incorrect password");
        // jwt
        const jwt = await new jose.SignJWT({
            userId: rows.id,
            username: rows.username,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(jwtSecret);
        res.cookie("accessToken", jwt, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.send("Login successful");
    });
});

app.get("/games", (req, res) => {
    const games = db.prepare(`SELECT * FROM games`).all();
    res.json(games);
});

app.get("/games/:gameId", (req, res) => {
    const { gameId } = req.params;
    const game = db.prepare(`SELECT * FROM games WHERE id = ?`).get(gameId);
    res.json(game);
});

app.get("/games/:gameId/rooms", (req, res) => {
    const { gameId } = req.params;
    const rooms = db
        .prepare(`SELECT * FROM rooms WHERE game_id = ?`)
        .all(gameId);
    res.json(rooms);
});

app.get("/rooms/:roomId", authProtectedMiddleware, (req, res) => {
    const { roomId } = req.params;
    const room = db.prepare(`SELECT * FROM rooms WHERE id = ?`).get(roomId);
    res.json(room);
});

app.get("/rooms/:roomId/join", authProtectedMiddleware, (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.userId;
    let room = db.prepare(`SELECT * FROM rooms WHERE id = ?`).get(roomId);
    if (room.player1_id === userId || room.player2_id == userId) {
        return res.json(room);
    }
    if (!room.player2_id) {
        db.prepare(`UPDATE rooms SET player2_id = ? WHERE id = ?`).run(
            userId,
            roomId,
        );
        room = db.prepare(`SELECT * FROM rooms WHERE id = ?`).get(roomId);
        return res.json(room);
    }
    return res.status(403).json({
        message: "This room is already full!",
    });
});

app.post("/games/:gameId/create-room", authProtectedMiddleware, (req, res) => {
    const { gameId } = req.params;
    const roomdId = uuidv6();
    const userId = req.user.userId;
    try {
        db.prepare(
            `INSERT INTO rooms(id, game_id, player1_id) VALUES (?, ?, ?)`,
        ).run(roomdId, gameId, userId);
        res.json({
            message: "Room created successfully",
            roomId: roomdId,
        });
    } catch (err) {
        return res.status(500).send(err);
    }
});

// websocket
const gameStates = {};

io.on("connection", (socket) => {
    console.log("socket connected: ", socket.id);

    socket.on("join room", ({ roomId, user }) => {
        const roomStr = `room:${roomId}`;
        socket.join(roomStr);
        gameStates[roomId] ??= {};
        if (
            gameStates[roomId].player1?.username === user.username ||
            gameStates[roomId].player2?.username === user.username
        ) {
            return;
        }
        if (!gameStates[roomId].player1) {
            gameStates[roomId] = {
                ...gameStates[roomId],
                player1: {
                    username: user.username,
                    id: user.id,
                    moves: [],
                },
            };
        } else if (!gameStates[roomId].player2) {
            gameStates[roomId] = {
                ...gameStates[roomId],
                player2: {
                    username: user.username,
                    id: user.id,
                    moves: [],
                },
            };
        } else {
            gameStates[roomId] = {
                ...gameStates[roomId],
                waitingQueues: [
                    {
                        username: user.username,
                        id: user.id,
                        moves: [],
                    },
                    ...(gameStates[roomId].waitingQueues ?? []),
                ],
            };
        }
        if (gameStates[roomId].player1 && gameStates[roomId].player2) {
            gameStates[roomId].canStart = true;
            gameStates[roomId].isPlaying = false;
        } else {
            gameStates[roomId].canStart = false;
            gameStates[roomId].isPlaying = false;
        }
        io.to(roomStr).emit("update gamestate", gameStates[roomId]);
        console.log("gameStates", gameStates);
    });

    socket.on("leave room", ({ roomId, user }) => {
        // console.log("user ", user.username, " leave room ", roomId);
        const roomStr = `room:${roomId}`;
        socket.leave(roomStr);
        gameStates[roomId] ??= {};
        // player1 is basically the room host, so if player1 left,
        // promote the remaining player to room host
        if (gameStates[roomId].player1?.username === user.username) {
            gameStates[roomId].player1 = gameStates[roomId].player2;
            gameStates[roomId].player2 =
                gameStates[roomId].waitingQueues?.pop();
        }
        if (gameStates[roomId].player2?.username === user.username) {
            gameStates[roomId].player2 =
                gameStates[roomId].waitingQueues?.pop();
        }
        if (gameStates[roomId].player1 && gameStates[roomId].player2) {
            gameStates[roomId].canStart = true;
            gameStates[roomId].isPlaying = false;
        } else {
            gameStates[roomId].canStart = false;
            gameStates[roomId].isPlaying = false;
        }
        io.to(roomStr).emit("update gamestate", gameStates[roomId]);
        console.log("gameStates", gameStates);
    });

    socket.on("start game", ({ roomId, userId }) => {
        const roomStr = `room:${roomId}`;
        gameStates[roomId] ??= {};
        console.log(
            roomId,
            userId,
            gameStates[roomId].canStart,
            gameStates[roomId].player1?.id,
        );
        if (
            gameStates[roomId].canStart &&
            userId === gameStates[roomId].player1?.id
        ) {
            gameStates[roomId] = {
                ...gameStates[roomId],
                canStart: false,
                isPlaying: true,
            };
        }
        io.to(roomStr).emit("update gamestate", gameStates[roomId]);
        console.log("gameStates", gameStates);
    });

    socket.on("disconnect", () => {
        console.log("socket disconnected: ", socket.id);
    });
});

httpServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
