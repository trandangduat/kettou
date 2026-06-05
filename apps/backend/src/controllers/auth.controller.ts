import { RequestHandler } from "express";
import {
    getCurrentUser,
    loginUser,
    registerUser,
} from "../services/auth.services.js";

export const getMe: RequestHandler = (req, res) => {
    try {
        const user = getCurrentUser(req.user.userId);
        return res.status(200).json(user);
    } catch (err) {
        return res.status(401).send(err.toString());
    }
};

export const logout: RequestHandler = (req, res) => {
    res.clearCookie("accessToken");
    return res.status(200).send("Logged out successfully");
};

export const register: RequestHandler = async (req, res) => {
    if (!req.body) {
        return res.status(400).send("No request body");
    }
    try {
        const { username, password } = req.body;
        await registerUser({ username, password });
        res.status(200).send("User registered successfully");
    } catch (err) {
        return res.status(400).send(err.toString());
    }
};

export const login: RequestHandler = async (req, res) => {
    if (req.user) {
        return res.status(400).send("Already logged in");
    }
    try {
        const { username, password } = req.body;
        const jwtToken = await loginUser({ username, password });
        res.cookie("accessToken", jwtToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).send("Login successful");
    } catch (err) {
        return res.status(400).send(err.toString());
    }
};
