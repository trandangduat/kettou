import { EndState, Match, MatchType, Player, PlayerStatus } from "./types.js";
import { GameRegistry } from "./index.js";
import { customAlphabet } from "nanoid";
const alphabet =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const generateId = (length: number): string => {
    return customAlphabet(alphabet, length)();
};

export const debugMatch = (m: any) => {
    console.log("🤓 MATCH:", JSON.stringify(m, null, 2));
};

export const newMatch = (gameId: string, matchType: MatchType): Match<any> => {
    return {
        id: generateId(8),
        gameId: gameId,
        type: matchType,
        status: "WAITING",
        players: [],
        gameState: null,
        createdAt: Date.now(),
    };
};

export const updateReadyStatus = (match: Match<any>): Match<any> => {
    if (match.status === "PLAYING" || match.status === "ENDED") {
        return match;
    }

    let ready =
        match.players.length >= 2 &&
        match.players.every((p) => p.status === "ONLINE");
    return {
        ...match,
        status: ready ? "READY" : "WAITING",
    };
};

export const addPlayerToMatch = (
    match: Match<any>,
    player: Player,
): Match<any> => {
    let newMatch: Match<any> = {
        ...match,
        players: [...match.players, { ...player }],
    };
    return updateReadyStatus(newMatch);
};

export const removePlayerFromMatch = (
    match: Match<any>,
    userId: string,
): Match<any> => {
    const newPlayers = [...match.players];
    const removedPlayerIndex = newPlayers.findIndex((p) => p.userId === userId);
    if (removedPlayerIndex >= 0) {
        newPlayers.splice(removedPlayerIndex, 1);
    }
    return updateReadyStatus({
        ...match,
        players: newPlayers,
    });
};

export const sanitizeMatchStateForClient = (
    match: Match<any>,
    userId: string,
): Match<any> => {
    const { gameId, players } = match;
    const engine = GameRegistry.getEngine(gameId);
    const newMatchState = engine.convertToClientMatchState(match, userId);
    const sanitizedPlayers = players.map((p) => ({ ...p }));
    return {
        ...newMatchState,
        players: sanitizedPlayers,
    };
};

export const updatePlayerStatus = (
    match: Match<any>,
    userId: string,
    status: PlayerStatus,
): Match<any> => {
    const updatedPlayers = match.players.map((p) =>
        p.userId === userId ? { ...p, status } : p,
    );
    return updateReadyStatus({ ...match, players: updatedPlayers });
};

export const abandonMatch = (
    match: Match<any>,
    whoAbandoned: string,
): Match<any> => {
    let endState: EndState = {
        winnerId: match.players.find((p) => p.userId != whoAbandoned)?.userId,
        reason: "PLAYER_ABANDONED",
    };

    return {
        ...match,
        status: "ENDED",
        endState,
    };
};
