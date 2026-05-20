import {
    getMe,
    logIn,
    logOut,
    register,
} from "../controllers/auth.controller.js";
import {
    authProtectedMiddleware,
    authPublicMiddleware,
} from "../middleware/auth.js";
import { Router } from "express";

const router = Router();

router.get("/me", authProtectedMiddleware, getMe);
router.post("/login", authPublicMiddleware, logIn);
router.post("/register", authPublicMiddleware, register);
router.get("/logout", authProtectedMiddleware, logOut);

export default router;
