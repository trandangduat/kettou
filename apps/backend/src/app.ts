import express from "express";
import cors from "cors";
import { WEB_ORIGIN } from "./config.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import gamesRouter from "./routes/games.routes.js";
import roomsRouter from "./routes/rooms.routes.js";

export const app = express();

app.use(express.json());
app.use(
    cors({
        origin: WEB_ORIGIN,
    }),
);
app.use(cookieParser());
app.use(authRouter);
app.use(gamesRouter);
app.use(roomsRouter);

app.get("/", (req, res) => {
    res.send("hahahaii");
});
