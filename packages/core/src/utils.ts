import { v6 as uuidv6 } from "uuid";
import { EndState, Match, MatchType, Player, PlayerStatus } from "./types.js";
import { GameRegistry } from "./index.js";

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
        createdAt: Date.now()
    };
};

export const updateReadyStatus = (match: Match<any>): Match<any> => {
    return {
        ...match,
        status: match.players.length < 2 ? "WAITING" : "READY",
    };
};

export const addPlayerToMatch = (
    match: Match<any>,
    player: Player,
): Match<any> => {
    const { username, userId, elo } = player;
    const isPlayer = match.players.find((p) => p.userId === userId);
    if (isPlayer) {
        return match;
    }
    let newPlayer: Player = {
        username,
        userId,
        elo: elo ?? 1000,
        status: "ONLINE",
    };
    let newMatch: Match<any> = {
        ...match,
        players: [...match.players, newPlayer],
    };
    return updateReadyStatus(newMatch);
};

export const removePlayerFromMatch = (
    match: Match<any>,
    userId: string,
): Match<any> => {
    let newMatch = { ...match };
    const { players } = newMatch;
    const removedPlayerIndex = players.findIndex((p) => p.userId === userId);
    if (removedPlayerIndex >= 0) {
        players.splice(removedPlayerIndex, 1);
    }
    return updateReadyStatus(newMatch);
};

export const sanitizeMatchStateForClient = (
    match: Match<any>,
    userId: string,
): Match<any> => {
    const { gameId, players } = match;
    const engine = GameRegistry.getEngine(gameId);
    const newMatchState = engine.convertToClientMatchState(match, userId);
    const sanitizedPlayers = players.map((p) => ({ ...p, elo: undefined }));
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
    return { ...match, players: updatedPlayers };
};

export const endGameByDisconnect = (
    match: Match<any>,
    whoDisconnected: string
): Match<any> => {
    const { players } = match;

    let endState: EndState = {
      winnerId: players.find(p => p.userId != whoDisconnected)?.userId,
      reason: "PLAYER_DISCONNECTED",
    }

    return {
        ...match,
        status: "ENDED",
        endState,
    }
}
