import { RequestHandler } from "express";
import * as jose from "jose";
import bcrypt from "bcrypt";
import { JWT_SECRET, SALT_ROUNDS } from "../config.js";
import db from "../db.js";

export const getMe: RequestHandler = (req, res) => {
    if (req.user) {
        return res.json(req.user);
    }
    res.status(401).json({
        msg: "Unauthorized",
    });
};

export const logOut: RequestHandler = (req, res) => {
    res.clearCookie("accessToken");
    return res.status(200).json({
        msg: "Logged out successfully",
    });
};

export const register: RequestHandler = (req, res) => {
    if (!req.body) return res.status(400).send("No req body");
    const { username, password } = req.body;
    const rows = db
        .prepare(`SELECT * FROM users WHERE username = ?`)
        .get(username);
    if (rows) return res.status(400).send("Username already exists");
    bcrypt.hash(password, SALT_ROUNDS, (err, hashed) => {
        if (err) return res.status(500).send(err);
        db.prepare(`INSERT INTO users(username, password) VALUES (?, ?)`).run(
            username,
            hashed,
        );
        res.send("User registered successfully");
    });
};

export const logIn: RequestHandler = (req, res) => {
    if (req.user) return res.status(400).send("Already logged in");
    const { username, password } = req.body;
    const rows = db
        .prepare<
            [string],
            {
                id: number;
                password: string;
                username: string;
            }
        >(`SELECT * FROM users WHERE username = ?`)
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
            .sign(JWT_SECRET);
        res.cookie("accessToken", jwt, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.send("Login successful");
    });
};
