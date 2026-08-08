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
        username: string;
        avatarUrls: any;
    } = await res.json();

    console.log("USER", user);

    return user;
};

export const meQueryOptions = queryOptions({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
});
