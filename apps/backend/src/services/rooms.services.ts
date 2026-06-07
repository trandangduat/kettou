import { initRoom, MatchType, Room } from "shared";
import { redis } from "../redis.js";

export const getLobbyKey = (gameId: string) => {
    return `game:${gameId}:lobby`;
};

export const getRoomKey = (roomId: string) => {
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
    return JSON.parse(data.toString()) as Room;
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

export const deleteRoom = async ({
    roomId,
    gameId,
}: {
    roomId: string;
    gameId: string;
}) => {
    const roomKey = getRoomKey(roomId);
    const lobbyKey = getLobbyKey(gameId);
};

export const createRoom = async ({
    gameId,
    matchType,
}: {
    gameId: string;
    matchType: MatchType;
}): Promise<Room> => {
    const room = initRoom({ gameId, matchType });
    const roomKey = getRoomKey(room.id);
    const lobbyKey = getLobbyKey(gameId);
    const createdAt = Date.now();
    const redisChain = redis.multi();
    redisChain.set(roomKey, JSON.stringify(room));
    if (matchType === "CUSTOM") {
        redisChain.zAdd(lobbyKey, [
            {
                score: createdAt,
                value: room.id,
            },
        ]);
    }
    await redisChain.exec();
    return room;
};

export const getAllRoomsInLobby = async ({
    gameId,
}: {
    gameId: string;
}): Promise<string[]> => {
    const lobbyKey = getLobbyKey(gameId);
    const roomsId = await redis.zRange(lobbyKey, 0, -1, { REV: true });
    return roomsId.map((roomId) => roomId.toString());
};
