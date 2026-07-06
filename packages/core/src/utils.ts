import { v6 as uuidv6 } from "uuid";
import { Match, MatchType } from "./types.js";

export const debugMatch = (m: any) => {
    console.log("MATCH:", JSON.stringify(m, null, 2));
};

export const newMatch = (gameId: string, matchType: MatchType): Match<any> => {
    return {
        id: uuidv6(),
        gameId: gameId,
        type: matchType,
        status: "WAITING",
        players: [],
        gameState: null,
    };
};

export const updateReadyStatus = (match: Match<any>): Match<any> => {
    return {
        ...match,
        status: match.players.length < 2 ? "WAITING" : "READY",
    };
};

export const addUserToMatch = (match: Match<any>, user: any): Match<any> => {
    const { username, id: userId, elo } = user;
    const isPlayer = match.players.find((p) => p.userId === userId);
    if (isPlayer) {
        return;
    }
    match = {
        ...match,
        players: [...match.players, { username, userId, elo }],
    };
    return updateReadyStatus(match);
};

export const removeUserFromMatch = (
    match: Match<any>,
    userId: string,
): Match<any> => {
    const { players } = match;
    const removedPlayerIndex = players.findIndex((p) => p.userId === userId);
    if (removedPlayerIndex >= 0) {
        players.splice(removedPlayerIndex, 1);
    }
    return updateReadyStatus(match);
};
