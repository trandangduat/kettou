import type { Server } from "socket.io";
import { setupMatchesSocket } from "./matches.socket.js";
import { setupLobbySocket } from "./lobby.socket.js";
import {
    setUpMatchmakingSocket,
    startMatchMakingWorker,
} from "./matchmaking.socket.js";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "../config.js";
import * as cookie from "cookie";
import { getUserRoomKey } from "./utils.js";
import { getUserCurrentMatch } from "../services/matches.services.js";

export const setUpSocket = (io: Server) => {
    startMatchMakingWorker(io);

    io.use(async (socket, next) => {
        const { cookie: cookieHeader } = socket.handshake.headers;
        console.log("cookiues", cookieHeader);
        if (!cookieHeader) {
            return next(new Error("No cookie available."));
        }

        const cookies = cookie.parseCookie(cookieHeader);
        const { accessToken } = cookies;
        if (!accessToken) {
            return next(new Error("No access token available."));
        }

        try {
            const { payload: user } = await jwtVerify(accessToken, JWT_SECRET);
            socket.data.userId = user.id;

            next();
        } catch (err) {
            console.error(err);
            next(new Error("Unknown user"));
        }
    });

    io.use((socket, next) => {
        try {
            const { userId } = socket.data;
            socket.join(getUserRoomKey(userId));

            next();
        } catch (err) {
            console.error(err);
            next(err);
        }
    });

    io.use(async (socket, next) => {
        try {
            const { userId } = socket.data;
            const currentMatch = await getUserCurrentMatch(userId);
            console.log("%%%%%%%%% backend currentMatch", currentMatch);
            if (!currentMatch) return next();

            const { gameId, matchId } = currentMatch;
            socket.emit("current-match-updated", gameId, matchId);

            next();
        } catch (err) {
            console.error(err);
            next(err);
        }
    });

    io.on("connection", (socket) => {
        console.log("socket connected: ", socket.id);
        console.log("socket user: ", socket.data.userId);

        setupLobbySocket({ io, socket });
        setupMatchesSocket({ io, socket });
        setUpMatchmakingSocket({ io, socket });

        socket.on("disconnect", () => {
            console.log("socket disconnected: ", socket.id);
        });
    });
};
