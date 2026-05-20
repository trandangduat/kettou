import {
    getAllGames,
    getAllRoomsOfGame,
    getGameDetails,
} from "../controllers/games.controller.js";
import { Router } from "express";

const router = Router();

router.get("/games", getAllGames);
router.get("/games/:gameId", getGameDetails);
router.get("/games/:gameId/rooms", getAllRoomsOfGame);

export default router;
