import dotenv from "dotenv";
import { createClient, RESP_TYPES } from "redis";
dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redis = await createClient({
    url: redisUrl,
})
    .on("error", (err) =>
        console.error("Having issues connecting to Redis: ", err),
    )
    .connect();
