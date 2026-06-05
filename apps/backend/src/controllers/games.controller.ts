import { RequestHandler } from "express";
import { getGameById, getGames } from "../services/games.services.js";

export const allGames: RequestHandler = (req, res) => {
    const games = getGames();
    return res.status(200).json(games);
};

type GameDetailsParams = {
    gameId: string;
};

export const gameDetails: RequestHandler<GameDetailsParams> = (req, res) => {
    const { gameId } = req.params;
    const game = getGameById(gameId);
    return res.status(200).json(game);
};
