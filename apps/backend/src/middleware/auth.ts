import { jwtVerify } from "jose";
import { JWT_SECRET } from "../config.js";
import type { RequestHandler } from "express";

const authPublicMiddleware: RequestHandler = async (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    if (accessToken) {
        try {
            await jwtVerify(accessToken, JWT_SECRET);
            res.status(401).send("Already logged in, not allowed to do this");
        } catch (err) {
            res.clearCookie("accessToken");
            next();
        }
    } else {
        next();
    }
};

interface AuthUser {
    userId: number;
    username: string;
}

const authProtectedMiddleware: RequestHandler = async (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    if (accessToken) {
        try {
            const { payload } = (await jwtVerify(accessToken, JWT_SECRET)) as {
                payload: AuthUser;
            };
            req.user = payload;
        } catch (err) {
            res.clearCookie("accessToken");
            res.send(err);
        }
        next();
    } else {
        res.status(401).send("Not logged in, not authorized");
    }
};

export { authPublicMiddleware, authProtectedMiddleware };
