import db from "../db.js";
import { getNewElo } from "../logics/elo.logic.js";
import { redis } from "../redis.js";
import { GameRegistry, Match, MatchType, Player } from "@mini-games/core";
import { Round } from "@mini-games/game-dice-territory";

export const getLobbyKey = (id: string) => {
    return `game:${id}:lobby`;
};

export const getMatchKey = (id: string) => {
    return `match:${id}`;
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

export const setMatchState = async ({
    matchId,
    matchState,
}: {
    matchId: string;
    matchState: Match<any>;
}) => {
    await redis.set(getMatchKey(matchId), JSON.stringify(matchState));
};

export const deleteMatch = async ({
    matchId,
    gameId,
}: {
    matchId: string;
    gameId: string;
}) => {
    const matchKey = getMatchKey(matchId);
    const lobbyKey = getLobbyKey(gameId);
    const redisChain = redis.multi();
    redisChain.zRem(lobbyKey, matchId);
    redisChain.del(matchKey);
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

    const matchKey = getMatchKey(match.id);
    const lobbyKey = getLobbyKey(gameId);
    const createdAt = Date.now();
    const redisChain = redis.multi();
    redisChain.set(matchKey, JSON.stringify(match));
    if (matchType === "CUSTOM") {
        redisChain.zAdd(lobbyKey, [
            {
                score: createdAt,
                value: match.id,
            },
        ]);
    }
    await redisChain.exec();
    return match;
};

export const getAllMatchesInLobby = async ({
    gameId,
}: {
    gameId: string;
}): Promise<string[]> => {
    const lobbyKey = getLobbyKey(gameId);
    const matchesId = await redis.zRange(lobbyKey, 0, -1, { REV: true });
    return matchesId.map((matchId) => matchId.toString());
};
export const saveMatch = ({
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
        `INSERT INTO match_players (match_id, user_id, player_slot) VALUES (?, ?, ?)`,
    );
    const insertManyPlayers = db.transaction((players: Player[]) => {
        for (let i = 0; i < players.length; i++) {
            insertPlayer.run(id, players[i].userId, i);
        }
    });
    insertManyPlayers(players);
};

export const saveEndedMatch = ({
    match,
    endedAt,
}: {
    match: Match<any>;
    endedAt: number;
}) => {
    const { id, type, status, players, gameState } = match;
    const { rounds, endState } = gameState;
    const { winnerUserId, playerPoints } = endState;

    // update match status
    db.prepare(
        `UPDATE matches SET status = ?, ended_at = ?, winner_id = ? WHERE id = ?`,
    ).run(status, endedAt, endState.winnerUserId, id);

    // update players status
    const updatePlayer = db.prepare(`
      UPDATE match_players SET score = ?, result = ? WHERE match_id = ? AND user_id = ?`);

    const updateManyPlayers = db.transaction(
        (playerPoints: Record<string, number>) => {
            for (let playerId in playerPoints) {
                let score = playerPoints[playerId];
                let isDraw = !winnerUserId;
                let isWinner = playerId === winnerUserId;
                let result = isDraw ? "DRAW" : isWinner ? "WIN" : "LOSS";
                updatePlayer.run(score, result, id, playerId);
            }
        },
    );
    updateManyPlayers(playerPoints);

    // update players elo
    if (type === "RANKED") {
        const updatePlayerElo = db.prepare(`
        UPDATE users SET elo = ? WHERE id = ?`);

        const updateManyPlayersElo = db.transaction(() => {
            for (let i = 0; i < 2; i++) {
                let isDraw = !winnerUserId;
                let isWinner = players[i].userId === winnerUserId;
                let result = isDraw ? 0.5 : isWinner ? 1 : 0;
                let newElo = getNewElo({
                    yourRating: players[i].elo,
                    enemyRating: players[1 - i].elo,
                    result: result,
                });
                updatePlayerElo.run(newElo, players[i].userId);
            }
        });
        updateManyPlayersElo();
    }

    // insert players moves
    const insertMove = db.prepare(
        `INSERT INTO match_moves(match_id, player_id, move, move_number) VALUES (?, ?, ?, ?)`,
    );
    const insertManyMoves = db.transaction((rounds: Round[]) => {
        for (let i = 0; i < rounds.length; i++) {
            const { move, playerId } = rounds[i];
            insertMove.run(id, playerId, JSON.stringify(move), i);
        }
    });
    insertManyMoves(rounds);
};
