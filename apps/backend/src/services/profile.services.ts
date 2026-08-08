import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../s3.js";
import dotenv from "dotenv";
import db from "../db.js";
import { UserAvatar } from "@mini-games/core";
dotenv.config();

type AllUrls = { putUrl: string; publicUrl: string };

export const getAvatarPresignedUrls = async (userId: string, type: string) => {
    const sizes: string[] = ["small", "large"];
    const putUrlsPromises = [];
    const urls: Record<string, AllUrls> = {};

    for (let size of sizes) {
        putUrlsPromises.push(
            getSignedUrl(
                s3,
                new PutObjectCommand({
                    Bucket: "kettou",
                    Key: `avatars/${userId}_${size}`,
                    ContentType: type,
                }),
            ),
        );
    }

    const res = await Promise.all(putUrlsPromises);

    for (let i = 0; i < sizes.length; i++) {
        const size = sizes[i];
        urls[size] = {
            putUrl: res[i],
            publicUrl: process.env.R2_PUBLIC_URL + `/avatars/${userId}_${size}`,
        };
    }

    return urls;
};

export const updateAvatarToDb = (
    userId: string,
    urls: UserAvatar,
) => {
    db.prepare(`UPDATE users SET avatarUrls = ? WHERE id = ?`).run(
        JSON.stringify(urls),
        userId,
    );
};
