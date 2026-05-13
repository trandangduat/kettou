import { jwtVerify } from "jose";
import dotenv from "dotenv";
dotenv.config();

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET);

async function authMiddleware(req, res, next) {
    const accessToken = req.cookies.accessToken;
    if (accessToken) {
        try {
            const { payload } = await jwtVerify(accessToken, jwtSecret);
            req.user = payload;
        } catch (err) {
            res.clearCookie("accessToken");
            res.send(err);
        }
    }
    next();
}

export default authMiddleware;
