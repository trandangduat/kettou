import db from "../db.js";
import { getNewElo } from "../logics/elo.logic.js";
import { redis } from "../redis.js";
import {
    GameRegistry,
    Match,
    MatchStatus,
    MatchType,
    Player,
} from "@mini-games/core";

type MatchSummary = {
    id: string;
    gameId: string;
    players: Player[];
    status: MatchStatus;
    createdAt: number;
};

export const getLobbyKey = (id: string) => {
    return `game:${id}:lobby`;
};

export const getMatchSummaryKey = (matchId: string) => {
    return `match:${matchId}:summary`;
};

// save summary of match state for game lobby UI
export const getMatchKey = (id: string) => {
    return `match:${id}`;
};

export const getUserCurrentMatchKey = (userId: string) => {
    return `user:${userId}:current-match`;
};

export const summarizeMatchState = (match: Match<any>): MatchSummary => {
    return {
        id: match.id,
        gameId: match.gameId,
        players: match.players,
        status: match.status,
        createdAt: match.createdAt,
    };
};

export const getMatchState = async ({
    matchId,
}: {
    matchId: string;
}): Promise<Match<any> | null> => {
    const data = await redis.get(getMatchKey(matchId));
    if (!data) {
        return null;
    }
    return JSON.parse(data.toString()) as Match<any>;
};

export const saveMatchState = async (match: Match<any>) => {
    const matchKey = getMatchKey(match.id);
    const matchSummaryKey = getMatchSummaryKey(match.id);
    await redis.set(matchKey, JSON.stringify(match));
    if (match.status != "PLAYING") {
        await redis.set(
            matchSummaryKey,
            JSON.stringify(summarizeMatchState(match)),
        );
    }
};

export const deleteMatch = async ({
    matchId,
    gameId,
}: {
    matchId: string;
    gameId: string;
}) => {
    const matchKey = getMatchKey(matchId);
    const matchSummaryKey = getMatchSummaryKey(matchId);
    const lobbyKey = getLobbyKey(gameId);
    const redisChain = redis.multi();
    redisChain.zRem(lobbyKey, matchId);
    redisChain.del(matchKey);
    redisChain.del(matchSummaryKey);
    await redisChain.exec();
};

export const createMatch = async ({
    gameId,
    matchType,
}: {
    gameId: string;
    matchType: MatchType;
}): Promise<Match<any>> => {
    const gameEngine = GameRegistry.getEngine(gameId);
    const match = gameEngine.createNewMatchState(matchType);

    const redisChain = redis.multi();
    redisChain.set(getMatchKey(match.id), JSON.stringify(match));

    if (matchType === "CUSTOM") {
        redisChain.set(
            getMatchSummaryKey(match.id),
            JSON.stringify(summarizeMatchState(match)),
        );
        redisChain.zAdd(getLobbyKey(gameId), [
            {
                score: match.createdAt,
                value: match.id,
            },
        ]);
    }

    await redisChain.exec();

    return match;
};

export const getMatchesSummaryInLobby = async (
    gameId: string,
): Promise<MatchSummary[]> => {
    const lobbyKey = getLobbyKey(gameId);
    const matchesId = await redis.zRange(lobbyKey, 0, -1, { REV: true });
    const matchSummaryKeys = matchesId.map((id) => getMatchSummaryKey(id));
    if (matchSummaryKeys.length === 0) {
        return [];
    }
    const result = await redis.mGet(matchSummaryKeys);
    const matchSummaries = result.map((str) => JSON.parse(str));
    return matchSummaries;
};

export const saveMatchToDb = ({
    match,
    startedAt,
}: {
    match: Match<any>;
    startedAt: number;
}) => {
    const { id, gameId, status, players, type } = match;

    // create match
    db.prepare(
        `INSERT INTO matches(id, type, status, game_id, started_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(id, type, status, gameId, startedAt);

    // insert match players
    const insertPlayer = db.prepare(
        `INSERT INTO match_players (match_id, user_id, elo_before) VALUES (?, ?, ?)`,
    );
    const insertManyPlayers = db.transaction((players: Player[]) => {
        for (const { userId, elo } of players) {
            insertPlayer.run(id, userId, elo);
        }
    });
    insertManyPlayers(players);
};

export const saveEndedMatchToDb = ({
    match,
    endedAt,
}: {
    match: Match<any>;
    endedAt: number;
}) => {
    const { id, type, status, players, gameId, endState } = match;
    const { winnerId } = endState;

    console.log("END STATEEE", endState);

    // update match status
    db.prepare(`UPDATE matches SET status = ?, ended_at = ? WHERE id = ?`).run(
        status,
        endedAt,
        id,
    );

    // update players elo
    const newPlayerElos: Record<string, number> = {};
    for (let i = 0; i < players.length; i++) {
        newPlayerElos[players[i].userId] = players[i].elo;
    }

    if (type === "RANKED") {
        const updatePlayerElo =
            db.prepare(`INSERT INTO game_elos (user_id, game_id, elo)
                VALUES (?, ?, ?)
                ON CONFLICT(game_id, user_id)
                DO UPDATE SET elo = excluded.elo`);

        const updateManyPlayersElo = db.transaction(() => {
            for (let i = 0; i < players.length; i++) {
                let isDraw = !winnerId;
                let isWinner = players[i].userId === winnerId;
                let result = isDraw ? 0.5 : isWinner ? 1 : 0;
                let newElo = getNewElo({
                    yourRating: players[i].elo,
                    enemyRating: players[1 - i].elo,
                    result: result,
                });
                updatePlayerElo.run(players[i].userId, gameId, newElo);
                newPlayerElos[players[i].userId] = newElo;
            }
        });
        updateManyPlayersElo();
    }

    // update players status
    const updatePlayer = db.prepare(`
      UPDATE match_players SET result = ?, elo_after = ? WHERE match_id = ? AND user_id = ?`);

    const updateManyPlayers = db.transaction(() => {
        for (let { userId } of players) {
            let isDraw = !winnerId;
            let isWinner = userId === winnerId;
            let result = isDraw ? "DRAW" : isWinner ? "WIN" : "LOSS";
            let newElo = newPlayerElos[userId];
            updatePlayer.run(result, newElo, id, userId);
        }
    });
    updateManyPlayers();
};

export const saveUserCurrentMatch = async (
    userId: string,
    gameId: string,
    matchId: string,
) => {
    const key = getUserCurrentMatchKey(userId);
    await redis.set(key, JSON.stringify({ gameId, matchId }));
};

export const getUserCurrentMatch = async (
    userId: string,
): Promise<{ gameId: string; matchId: string } | null> => {
    const key = getUserCurrentMatchKey(userId);
    const result = await redis.get(key);
    return result ? JSON.parse(result) : null;
};

export const clearUserCurrentMatch = async (userId: string) => {
    const key = getUserCurrentMatchKey(userId);
    await redis.del(key);
};
