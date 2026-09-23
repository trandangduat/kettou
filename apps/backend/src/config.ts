import dotenv from "dotenv";
dotenv.config();

export const ALLOWED_CLIENT_ORIGINS = [
    "http://localhost:3001",
    "http://127.0.0.1:3001",
];
export const BACKEND_PORT = 1109;
export const SALT_ROUNDS = 10;
export const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
export const DEFAULT_ELO = 1000;
export const MATCHMAKING_DEBOUNCE = 200000;
