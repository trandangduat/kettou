import db from "../db.js";
import * as jose from "jose";
import bcrypt from "bcrypt";
import { JWT_SECRET, SALT_ROUNDS } from "../config.js";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
import { UserAvatar } from "@mini-games/core";
dotenv.config();

export const getUserById = (userId: string) => {
    let user = db
        .prepare<
            [string],
            { id: string; avatarUrls: any }
        >(`SELECT id, avatarUrls FROM users WHERE id = ?`)
        .get(userId);

    if (!user) {
        throw new Error("Cannot find current user, baka >.<!");
    }

    if (user.avatarUrls) {
        user.avatarUrls = JSON.parse(user.avatarUrls) as UserAvatar;
    } else {
        user.avatarUrls = {
            small: process.env.R2_PUBLIC_URL + "/avatars/avatar_60x60.jpg",
            large: process.env.R2_PUBLIC_URL + "/avatars/avatar_200x200.jpg",
        };
    }

    return user as {
        id: string;
        avatarUrls: UserAvatar;
    };
};

type RegisterInputProps = {
    id: string;
    password: string;
};

export const registerUser = async (input: RegisterInputProps) => {
    const { id, password } = input;
    const user = db
        .prepare(`SELECT id FROM users WHERE id = ?`)
        .get(id) as { id: string } | undefined;

    if (user) {
        throw new Error("Username already exists");
    }

    const hashResult = await bcrypt.hash(password, SALT_ROUNDS);
    db.prepare(`INSERT INTO users(id, password) VALUES (?, ?)`).run(
        id,
        hashResult,
    );
};

type LoginInputProps = {
    id: string;
    password: string;
};

export const loginUser = async (input: LoginInputProps) => {
    const { id, password } = input;
    const user = db
        .prepare(`SELECT id, password FROM users WHERE id = ?`)
        .get(id) as { id: string; password: string } | undefined;

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
