export type Game = {
    id: string;
    name: string;
    description: string;
    rules: string;
};

export const getAllGames = async (): Promise<Game[] | null> => {
    try {
        const res = await fetch(`/api/games`);
        const games = await res.json();
        return games;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const getGameById = async (gameId: string): Promise<Game | null> => {
    try {
        const res = await fetch(`/api/games/${gameId}`);
        const game = await res.json();
        return game;
    } catch (error) {
        console.error(error);
        return null;
    }
};
