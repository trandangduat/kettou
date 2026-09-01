import type { UserAvatar } from "@mini-games/core";
import { queryOptions } from "@tanstack/react-query";

export const fetchMe = async () => {
    const res = await fetch("/api/me");
    if (res.status === 401) {
        return null;
    }
    if (!res.ok) {
        throw new Error("Failed to get /api/me");
    }
    let user: {
        id: string;
        avatarUrls: UserAvatar;
    } = await res.json();

    console.log("USER", user);

    return user;
};

export const meQueryOptions = queryOptions({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
});

export const logout = async () => {
    const res = await fetch("/api/logout", { method: "POST" });
    if (!res.ok) {
        throw new Error(await res.text());
    }
};

export const login = async (data: any) => {
    const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }
};

export const register = async (data: any) => {
    const res = await fetch("/api/register", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }
};
