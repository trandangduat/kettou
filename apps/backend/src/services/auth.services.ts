import db from "../db.js";
import * as jose from "jose";
import bcrypt from "bcrypt";
import { JWT_SECRET, SALT_ROUNDS } from "../config.js";
import { v6 as uuidv6 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

export const getUserById = (userId: string) => {
    let user = db
        .prepare<
            [string],
            { id: string; username: string, avatarUrls: any }
        >(`SELECT id, username, avatarUrls FROM users WHERE id = ?`)
        .get(userId);

    if (!user) {
        throw new Error("Cannot find current user, baka >.<!");
    }

    if (user.avatarUrls) {
        user.avatarUrls = JSON.parse(user.avatarUrls) as {
            small: string;
            large: string
        }
    } else {
        user.avatarUrls = {
            small: process.env.R2_PUBLIC_URL + "/avatars/avatar_60x60.jpg",
            large: process.env.R2_PUBLIC_URL + "/avatars/avatar_200x200.jpg"
        }
    }

    return user;
};

type RegisterInputProps = {
    username: string;
    password: string;
};

export const registerUser = async (input: RegisterInputProps) => {
    const { username, password } = input;
    const rows = getUserByUsername(username);

    if (rows) {
        throw new Error("Username already exists");
    }

    const hashResult = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = uuidv6();
    db.prepare(
        `INSERT INTO users(id, username, password) VALUES (?, ?, ?)`,
    ).run(userId, username, hashResult);
};

type LoginInputProps = {
    username: string;
    password: string;
};

export const loginUser = async (input: LoginInputProps) => {
    const { username, password } = input;
    const user = getUserByUsername(username);

    if (!user) {
        throw new Error("Username does not exist");
    }

    const compareResult = await bcrypt.compare(password, user.password);
    if (!compareResult) {
        throw new Error("Incorrect password");
    }

    const jwtToken = await new jose.SignJWT(user)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(JWT_SECRET);
    return jwtToken;
};

export const getUserByUsername = (username: string) => {
    return db
        .prepare<
            [string],
            {
                id: string;
                password: string;
                username: string;
            }
        >(`SELECT * FROM users WHERE username = ?`)
        .get(username);
};
