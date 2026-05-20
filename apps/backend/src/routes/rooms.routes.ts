import { Router } from "express";
import { authProtectedMiddleware } from "../middleware/auth.js";
import {
    createNewRoom,
    getRoomDetails,
} from "../controllers/rooms.controller.js";

const router = Router();

router.get("/rooms/:roomId", authProtectedMiddleware, getRoomDetails);
router.post(
    "/games/:gameId/create-room",
    authProtectedMiddleware,
    createNewRoom,
);

export default router;
