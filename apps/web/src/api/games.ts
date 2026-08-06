import { queryOptions } from "@tanstack/react-query";

export type Game = {
    id: string;
    name: string;
    description: string;
    rules: string;
};

const getAllGames = async (): Promise<Game[] | null> => {
    try {
        const res = await fetch(`/api/games`);
        const games = await res.json();
        return games;
    } catch (error) {
        console.error(error);
        return null;
    }
};

const getGameById = async (gameId: string): Promise<Game | null> => {
    try {
        const res = await fetch(`/api/games/${gameId}`);
        const game = await res.json();
        return game;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const getAllGamesQueryOptions = queryOptions({
    queryKey: ["list-games"],
    queryFn: getAllGames,
    staleTime: Infinity
});
