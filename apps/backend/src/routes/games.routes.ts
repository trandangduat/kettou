import { Router } from "express";
import { allGames, gameDetails } from "../controllers/games.controller.js";

const router = Router();

router.get("/games", allGames);
router.get("/games/:gameId", gameDetails);

export default router;
