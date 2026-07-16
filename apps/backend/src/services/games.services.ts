import { DEFAULT_ELO } from "../config.js";
import db from "../db.js";

export const getGames = () => {
    return db.prepare(`SELECT * FROM games`).all();
};

export const getGameById = (gameId: string) => {
    const game = db.prepare(`SELECT * FROM games WHERE id = ?`).get(gameId);
    return game;
};

export const getUserEloOfGames = (userId: string, gameIds: string[]) => {
    const rawResult = db.prepare(
            `SELECT game_id, elo FROM game_elos
            WHERE user_id = ?
            AND game_id IN (${gameIds.map(() => "?").join(",")})`,
        )
        .all(userId, ...gameIds) as { game_id: string; elo: number }[] ?? [];

    let result: Record<string, number> = {};
    for (let id of gameIds) {
        result[id] = 1000;
    }
    for (let row of rawResult) {
        result[row.game_id] = row.elo;
    }
    return result;
};

// console.log(
//     "HHHHHHHHHHAHAHA",
//     getUserEloOfGames("1f179de1-07f6-6100-8bf8-17f18c444c41", [
//         "dice-territory",
//         "card-durak",
//     ]),
// );
