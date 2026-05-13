export const fetchMe = async () => {
    const res = await fetch("/api/me");
    if (res.status === 401) {
        return null;
    }
    if (!res.ok) {
        throw new Error("Failed to get /api/me");
    }
    return res.json();
};
