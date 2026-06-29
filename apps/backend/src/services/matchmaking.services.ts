import { canMatch, QueuePlayer } from "../logics/matchmaking.logic.js";
import { redis } from "../redis.js";

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

export const getPairsInMmQueue = async ({ gameId }: { gameId: string }) => {
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

    const found = {};
    const pairs = [];
    for (let i = 0; i < playersInQ.length; i++) {
        for (let j = playersInQ.length - 1; j > i; j--) {
            let playerA = playersInQ[i];
            let playerB = playersInQ[j];
            if (
                canMatch(playerA, playerB) &&
                !found[playerA.userId] &&
                !found[playerB.userId]
            ) {
                found[playerA.userId] = playerB.userId;
                found[playerB.userId] = playerA.userId;
                pairs.push({ playerA, playerB });
                break;
            }
        }
    }
    return pairs;
};

export const removePairsFromMmQueue = async ({
    gameId,
    pairs,
}: {
    gameId: string;
    pairs: Record<string, QueuePlayer>[];
}) => {
    const mmKey = getMatchmakingKey(gameId);
    const redisChain = redis.multi();
    for (let pair of pairs) {
        const { playerA, playerB } = pair;
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
