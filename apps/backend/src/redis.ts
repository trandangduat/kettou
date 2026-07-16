import dotenv from "dotenv";
import { createClient } from "redis";
dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

type RedisSortedSetMember = {
    score: number;
    value: string;
};

type RedisZRangeOptions = {
    REV?: boolean;
};

type RedisKey = string | string[];

export interface RedisMulti {
    set(key: string, value: string): RedisMulti;
    get(key: string): RedisMulti;
    del(key: RedisKey): RedisMulti;
    zAdd(
        key: string,
        member: RedisSortedSetMember | RedisSortedSetMember[],
    ): RedisMulti;
    zRem(key: string, member: RedisKey): RedisMulti;
    zRange(
        key: string,
        start: number,
        stop: number,
        options?: RedisZRangeOptions,
    ): RedisMulti;
    exec(): Promise<unknown[]>;
}

export interface RedisClient {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<unknown>;
    del(key: RedisKey): Promise<unknown>;
    zAdd(
        key: string,
        member: RedisSortedSetMember | RedisSortedSetMember[],
    ): Promise<unknown>;
    zRem(key: string, member: RedisKey): Promise<unknown>;
    zRange(
        key: string,
        start: number,
        stop: number,
        options?: RedisZRangeOptions,
    ): Promise<string[]>;
    multi(): RedisMulti;
}

const client = await createClient({
    url: redisUrl,
})
    .on("error", (err) =>
        console.error("Having issues connecting to Redis: ", err),
    )
    .connect();

export const redis = client as unknown as RedisClient;
