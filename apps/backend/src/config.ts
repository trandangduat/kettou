import dotenv from "dotenv";
dotenv.config();

export const WEB_ORIGIN = "http://localhost:3001";
export const BACKEND_PORT = 3000;
export const SALT_ROUNDS = 10;
export const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
