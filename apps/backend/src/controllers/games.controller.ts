import { RequestHandler } from "express";
import db from "../db.js";

export const getAllGames: RequestHandler = (req, res) => {
    const games = db.prepare(`SELECT * FROM games`).all();
    res.json(games);
};

export const getGameDetails: RequestHandler = (req, res) => {
    const { gameId } = req.params;
    const game = db.prepare(`SELECT * FROM games WHERE id = ?`).get(gameId);
    res.json(game);
};

export const getAllRoomsOfGame: RequestHandler = (req, res) => {
    const { gameId } = req.params;
    const rooms = db
        .prepare(`SELECT * FROM rooms WHERE game_id = ?`)
        .all(gameId);
    res.json(rooms);
};
