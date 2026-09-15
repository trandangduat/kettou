import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import gamesRouter from "./routes/games.routes.js";
import profileRouter from "./routes/profile.routes.js";
import { ALLOWED_CLIENT_ORIGINS } from "./config.js";

export const app = express();

app.use(express.json());
app.use(
    cors({
        origin: ALLOWED_CLIENT_ORIGINS,
        credentials: true,
    }),
);
app.use(cookieParser());
app.use(authRouter);
app.use(gamesRouter);
app.use(profileRouter);

app.get("/", (req, res) => {
    res.send("hahahaii");
});
