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

export const getLobbyKey = (gameId: string) => {
    return `game:${gameId}:lobby`;
};

export const deleteRoom = async ({
    roomId,
    gameId,
}: {
    roomId: string;
    gameId: string;
}) => {
    const roomKey = getRoomKey(roomId);
    const lobbyKey = getLobbyKey(gameId);
    const lmao = await redis.multi().zRem(lobbyKey, roomId).del(roomKey).exec();
};

export const createRoom = async ({
    gameId,
}: {
    gameId: string;
}): Promise<Room> => {
    const room = initRoom({ gameId });
    const roomKey = getRoomKey(room.id);
    const lobbyKey = getLobbyKey(gameId);
    const createdAt = Date.now();
    await redis
        .multi()
        .set(roomKey, JSON.stringify(room))
        .zAdd(lobbyKey, [
            {
                score: createdAt,
                value: room.id,
            },
        ])
        .exec();
    return room;
};

export const getAllRoomsInLobby = async ({
    gameId,
}: {
    gameId: string;
}): Promise<string[]> => {
    const lobbyKey = getLobbyKey(gameId);
    const roomsId = await redis.zRange(lobbyKey, 0, -1, { REV: true });
    return roomsId;
};
