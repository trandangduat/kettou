import dotenv from "dotenv";
import { createClient, RESP_TYPES } from "redis";
import { initRoom, MatchType, Room } from "shared";
import { canMatch, QueuePlayer } from "./logics/matchmaking.logic.js";
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

export const getLobbyKey = (gameId: string) => {
    return `game:${gameId}:lobby`;
};

export const getMatchmakingKey = (gameId: string) => {
    return `matchmaking:${gameId}:queue`;
};

export const getMatchmakingPlayerKey = ({
    userId,
    gameId,
}: {
    userId: string;
    gameId: string;
}) => {
    return `matchmaking:${gameId}:player:${userId}`;
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
    const lmao = await redis.multi().zRem(lobbyKey, roomId).del(roomKey).exec();
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

export const addToMatchmakingQueue = async ({
    gameId,
    player,
}: {
    gameId: string;
    player: Record<string, any>;
}) => {
    const mmKey = getMatchmakingKey(gameId);
    const mmPlayerKey = getMatchmakingPlayerKey({
        userId: player.userId,
        gameId,
    });
    await redis
        .multi()
        .set(mmPlayerKey, JSON.stringify(player))
        .zAdd(mmKey, {
            score: player.elo,
            value: player.userId,
        })
        .exec();
};

export const removeFromMatchmakingQueue = async ({
    gameId,
    userId,
}: {
    gameId: string;
    userId: string;
}) => {
    const mmKey = getMatchmakingKey(gameId);
    const mmPlayerKey = getMatchmakingPlayerKey({
        userId,
        gameId,
    });
    await redis.multi().zRem(mmKey, userId).del(mmPlayerKey).exec();
};

export const getMatchesInMmQueue = async ({ gameId }: { gameId: string }) => {
    const mmKey = getMatchmakingKey(gameId);
    const playersId = await redis.zRange(mmKey, 0, -1);
    const redisChain = redis.multi();
    for (let id of playersId) {
        redisChain.get(
            getMatchmakingPlayerKey({ userId: id.toString(), gameId }),
        );
    }
    const rawData = await redisChain.exec();
    const playersInQ = rawData
        .filter((value) => typeof value === "string")
        .map((value) => JSON.parse(value) as QueuePlayer);

    const matched = {};
    const matches = [];
    for (let i = 0; i < playersInQ.length; i++) {
        for (let j = playersInQ.length - 1; j > i; j--) {
            let playerA = playersInQ[i];
            let playerB = playersInQ[j];
            if (
                canMatch(playerA, playerB) &&
                !matched[playerA.userId] &&
                !matched[playerB.userId]
            ) {
                matched[playerA.userId] = playerB.userId;
                matched[playerB.userId] = playerA.userId;
                matches.push({ playerA, playerB });
                break;
            }
        }
    }
    return matches;
};

export const removeMatchesFromMmQueue = async ({
    gameId,
    matches,
}: {
    gameId: string;
    matches: Record<string, QueuePlayer>[];
}) => {
    const mmKey = getMatchmakingKey(gameId);
    const redisChain = redis.multi();
    for (let match of matches) {
        const { playerA, playerB } = match;
        const mmPlayerKeyA = getMatchmakingPlayerKey({
            userId: playerA.userId,
            gameId,
        });
        const mmPlayerKeyB = getMatchmakingPlayerKey({
            userId: playerB.userId,
            gameId,
        });
        redis.del(mmPlayerKeyA);
        redis.del(mmPlayerKeyB);
        redis.zRem(mmKey, playerA.userId);
        redis.zRem(mmKey, playerB.userId);
    }
    await redisChain.exec();
};
