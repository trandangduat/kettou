import type { MatchStatus, Player } from "@mini-games/core";

export type Match = {
    id: string;
    gameId: string;
    players: Player[];
    status: MatchStatus;
    createdAt: number;
};
