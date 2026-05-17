import { jwtVerify } from "jose";
import dotenv from "dotenv";
dotenv.config();

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);

async function authPublicMiddleware(req, res, next) {
    const accessToken = req.cookies.accessToken;
    if (accessToken) {
        try {
            const { payload } = await jwtVerify(accessToken, jwtSecret);
            req.status(401).send("Already logged in, not allowed to do this");
        } catch (err) {
            res.clearCookie("accessToken");
            next();
        }
    } else {
        next();
    }
}

async function authProtectedMiddleware(req, res, next) {
    const accessToken = req.cookies.accessToken;
    if (accessToken) {
        try {
            const { payload } = await jwtVerify(accessToken, jwtSecret);
            req.user = payload;
        } catch (err) {
            res.clearCookie("accessToken");
            res.send(err);
        }
        next();
    } else {
        res.status(401).send("Not logged in, not authorized");
    }
}

export { authPublicMiddleware, authProtectedMiddleware };
