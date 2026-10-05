import { GameRegistry, Player, UserAvatar } from "@mini-games/core";
import { canMatch } from "../logics/matchmaking.logic.js";
import { redis } from "../redis.js";
import { logger } from "../logger.js";

interface PlayerInQ {
    userId: string;
    elos: Record<string, number>;
    joinedAt: number;
    avatarUrls?: UserAvatar
}

interface Pair {
    player1: Player;
    player2: Player;
    gameId: string;
    waitTime: number;
}

// each gameId has a separate queue sorted by elo
const getQueueKey = (gameId: string) => {
    return `matchmaking:queue:${gameId}`;
};

// matchmaking player metadata is stored separately in a set
const getPlayerKey = (userId: string) => {
    return `matchmaking:player:${userId}`;
};

export const addPlayerToMmQueue = async ({
    gameIds,
    player,
}: {
    gameIds: string[];
    player: PlayerInQ;
}) => {
    const playerKey = getPlayerKey(player.userId);
    const redisChain = redis.multi();
    redisChain.set(playerKey, JSON.stringify(player));
    for (let gameId of gameIds) {
        const queueKey = getQueueKey(gameId);
        redisChain.zAdd(queueKey, {
            score: player.elos[gameId],
            value: player.userId,
        });
    }
    await redisChain.exec();
};

export const removePlayerFromMmQueue = async (userId: string) => {
    const playerKey = getPlayerKey(userId);
    const playerRaw = await redis.get(playerKey);
    const player =
        playerRaw && typeof playerRaw === "string"
            ? (JSON.parse(playerRaw) as PlayerInQ)
            : null;
    if (!player) return;

    const redisChain = redis.multi();
    for (let gameId in player.elos) {
        const queueKey = getQueueKey(gameId);
        redisChain.zRem(queueKey, userId);
    }
    redisChain.del(playerKey);
    await redisChain.exec();
};

export const checkPlayerInMmQueue = async (userId: string) : Promise<boolean> => {
    const playerKey = getPlayerKey(userId);
    const player = await redis.get(playerKey);
    if (player) {
        return true;
    }
    return false;
};

const getAllGameQueuePlayerIds = async (): Promise<string[][]> => {
  const gameIds = GameRegistry.getAllGameIds();
  let redisChain = redis.multi();
  for (let gameId of gameIds) {
      const queueKey = getQueueKey(gameId);
      redisChain.zRange(queueKey, 0, -1);
  }
  return (await redisChain.exec()) as unknown as string[][];
}

const getAllQueuePlayersInfo = async (queues: string[][]): Promise<Record<string, any>> => {
  let playerIdSet = new Set<string>(queues.flat());
  let redisChain = redis.multi();
  redisChain = redis.multi();
  for (let playerId of playerIdSet.values()) {
      redisChain.get(getPlayerKey(playerId));
  }
  const rawData = await redisChain.exec();
  const players: Record<string, any> = {};
  for (let item of rawData) {
      if (typeof item !== "string") continue;
      let player = JSON.parse(item) as PlayerInQ;
      players[player.userId] = player;
  }
  return players;
};

export const getPairsInMmQueue = async () => {
    // get list of playerIds in queue for each game
    const queues = await getAllGameQueuePlayerIds();
    // get all players and their information in MM Queue currently
    const players = await getAllQueuePlayersInfo(queues);
    // get all possible matching pairs from diff games
    const gameIds = GameRegistry.getAllGameIds();
    const allPairs: Pair[] = [];
    gameIds.forEach((gameId, index) => {
        let queue = queues[index];
        let matched: Record<string, boolean> = {};

        for (let id1 of queue) {
            for (let id2 of queue) {
                if (id1 === id2) continue;
                let playerA = players[id1];
                let playerB = players[id2];
                playerA = {
                    ...playerA,
                    elo: playerA.elos[gameId],
                    elos: undefined,
                };
                playerB = {
                    ...playerB,
                    elo: playerB.elos[gameId],
                    elos: undefined,
                };

                if (
                    canMatch(playerA, playerB) &&
                    !matched[playerA.userId] &&
                    !matched[playerB.userId]
                ) {
                    matched[playerA.userId] = true;
                    matched[playerB.userId] = true;
                    allPairs.push({
                        player1: playerA,
                        player2: playerB,
                        gameId,
                        waitTime:
                            Date.now() -
                            Math.min(playerA.joinedAt, playerB.joinedAt),
                    });
                    break;
                }
            }
        }
    });
    // sort pairs by wait time (descending) and iteratively get the pairs from top of stack
    allPairs.sort((a, b) => b.waitTime - a.waitTime);
    // filter out pairs that have players that were already matched before
    let finalPairs: Pair[] = [];
    let occ: Record<string, boolean> = {};
    for (let pair of allPairs) {
        if (occ[pair.player1.userId] || occ[pair.player2.userId]) {
            continue;
        }
        occ[pair.player1.userId] = true;
        occ[pair.player2.userId] = true;
        finalPairs.push(pair);
    }
    return finalPairs;
};

export const removePairsFromMmQueue = async (pairs: Pair[]) => {
    for (let pair of pairs) {
        const player1Id = pair.player1.userId;
        const player2Id = pair.player2.userId;
        await removePlayerFromMmQueue(player1Id);
        await removePlayerFromMmQueue(player2Id);
    }
};
