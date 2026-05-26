import dotenv from "dotenv";
import { createClient, RESP_TYPES } from "redis";
import { initRoom, Room } from "shared";
dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redis = await createClient({
    url: redisUrl,
})
    .on("error", (err) =>
        console.error("Having issues connecting to Redis: ", err),
    )
    .connect();

const getRoomKey = (roomId: string) => {
    return `room:${roomId}`;
};

export const getRoomState = async ({
    roomId,
}: {
    roomId: string;
}): Promise<Room | null> => {
    const data = await redis.get(getRoomKey(roomId));
    if (!data) {
        return null;
    }
    return JSON.parse(data) as Room;
};

export const setRoomState = async ({
    roomId,
    roomState,
}: {
    roomId: string;
    roomState: Room;
}) => {
    await redis.set(getRoomKey(roomId), JSON.stringify(roomState));
};
