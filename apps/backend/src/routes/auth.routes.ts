import {
    getMe,
    login,
    logout,
    register,
} from "../controllers/auth.controller.js";
import {
    authProtectedMiddleware,
    authPublicMiddleware,
} from "../middleware/auth.js";
import { Router } from "express";

const router = Router();

router.post("/login", authPublicMiddleware, login);
router.post("/register", authPublicMiddleware, register);
router.get("/me", authProtectedMiddleware, getMe);
router.post("/logout", authProtectedMiddleware, logout);

export default router;
