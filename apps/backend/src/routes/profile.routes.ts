import { getAvatarPresigned, updateAvatar } from "../controllers/profile.controller.js";
import {
    authProtectedMiddleware,
} from "../middleware/auth.js";
import { Router } from "express";

const router = Router();

router.post("/profile/avatar/get-presigned", authProtectedMiddleware, getAvatarPresigned);
router.post("/profile/avatar/update", authProtectedMiddleware, updateAvatar);

export default router;
