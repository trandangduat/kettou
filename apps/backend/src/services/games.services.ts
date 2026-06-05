import db from "../db.js";

export const getGames = () => {
    return db.prepare(`SELECT * FROM games`).all();
};

export const getGameById = (gameId: string) => {
    const game = db.prepare(`SELECT * FROM games WHERE id = ?`).get(gameId);
    return game;
};
