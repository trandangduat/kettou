import {
    removePlayerFromMatch,
    Match,
    GameRegistry,
    addPlayerToMatch,
    sanitizeMatchStateForClient,
    Player,
    updatePlayerStatus,
    endGameByDisconnect,
    NOT_HOST_MSG,
} from "@mini-games/core";
import {
    addMatchPlayerSocket,
    clearUserCurrentMatch,
    createMatch,
    deleteMatch,
    getMatchPlayerSockets,
    getMatchState,
    getUserCurrentMatch,
    removeMatchPlayerSocket,
    saveEndedMatchToDb,
    saveMatchToDb,
    saveUserCurrentMatch,
    setMatchState,
    summarizeMatchState,
} from "../services/matches.services.js";
import type { SocketHandlerContext } from "./types.js";
import { Server } from "socket.io";
import { getLobbyRoomKey, getUserRoomKey, handleEvent } from "./utils.js";
import { getUserById } from "../services/auth.services.js";
import { getUserEloOfGame } from "../services/games.services.js";
import { DISCONNECT_TIMEOUT } from "../config.js";

const NOT_A_PLAYER_MSG =
    "You must be a player of this match to perform such actions.";

const disconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();

export const saveAndBroadcastMatchState = async ({
    io,
    match,
}: {
    io: Server;
    match: Match<any>;
}) => {
    const { id: matchId, players } = match;
    for (const { userId } of players) {
        // convert the match state to the client's perspective
        // so that the client only sees their own state, not the state of all players
        const matchForUser = sanitizeMatchStateForClient(match, userId);
        io.to(getUserRoomKey(userId)).emit("match:updated", matchForUser);
    }
    await setMatchState({ matchId, matchState: match });
};

export const setupMatchesSocket = ({ io, socket }: SocketHandlerContext) => {
    const createNewMatch = async ({ gameId, matchType }) => {
        console.log("CREATE NEW MATCH");
        const match = await createMatch({ gameId, matchType });
        const lobbyKey = getLobbyRoomKey(gameId);
        io.to(lobbyKey).emit(
            "lobby:new-match-created",
            summarizeMatchState(match),
        );
        return { matchId: match.id };
    };

    const joinMatch = async (matchId: string) => {
        console.log("JOIN MATCH");
        const { userId } = socket.data;
        let user = getUserById(userId);
        let match = await getMatchState({ matchId });
        if (!match) {
            throw new Error("Match with ID " + matchId + " not found");
        }

        let { gameId, players } = match;
        let lobbyKey = getLobbyRoomKey(gameId);
        let player = players.find((p) => p.userId === userId);

        if (player) {
            if (player.status === "OFFLINE") {
                match = updatePlayerStatus(match, userId, "ONLINE");
                clearTimeout(disconnectTimeouts.get(userId));
                disconnectTimeouts.delete(userId);
            }
        } else {
            let newPlayer: Player = {
                userId: user.id,
                elo: getUserEloOfGame(userId, gameId),
                status: "ONLINE",
                avatarUrls: user.avatarUrls,
            };
            match = addPlayerToMatch(match, newPlayer);
            io.to(lobbyKey).emit(
                "lobby:match-updated",
                summarizeMatchState(match),
            );
        }

        await saveUserCurrentMatch(userId, gameId, matchId);
        await addMatchPlayerSocket(matchId, userId, socket.id);
        await saveAndBroadcastMatchState({ io, match });
    };

    const startMatch = async (matchId: string) => {
        console.log("START MATCH: ", matchId);
        const userId = socket.data.userId;
        let match = await getMatchState({ matchId });
        if (!match) {
            throw new Error("Match with ID " + matchId + " not found");
        }
        let { players, status, gameId } = match;
        let isPlayer = players.some((p) => p.userId === userId);
        let isHost = players[0].userId === userId;
        let isReady = status === "READY";
        if (!isPlayer) {
            throw new Error(NOT_A_PLAYER_MSG);
        }
        if (!isHost) {
            throw new Error(NOT_HOST_MSG);
        }
        if (!isReady) {
            throw new Error("Match is not ready yet.");
        }
        const engine = GameRegistry.getEngine(match.gameId);
        match = engine.getInitialMatchState(match);
        match.status = "PLAYING";

        saveMatchToDb({ match, startedAt: Date.now() });
        await saveAndBroadcastMatchState({ io, match });
    };

    const processAction = async ({ matchId, action }) => {
        console.log("PROCESS ACTION: ", action.type);
        action.userId = socket.data.userId;
        let match = await getMatchState({ matchId });
        if (!match) {
            throw new Error("Match with ID " + matchId + " not found");
        }

        const engine = GameRegistry.getEngine(match.gameId);
        const res = engine.processAction(match, action);
        if (!res.isValid) {
            throw res.error;
        }

        match = res.newState;
        if (match.status === "ENDED") {
            saveEndedMatchToDb({ match, endedAt: Date.now() });
        }
        await saveAndBroadcastMatchState({ io, match });
        console.log("res data", res)
        return { data: res.data };
    };

    const leaveMatch = async (matchId: string) => {
        console.log("LEAVE MATCH");
        const { userId } = socket.data;
        let match = await getMatchState({ matchId });
        if (!match) {
            throw new Error("Match with ID " + matchId + " not found");
        }
        let isPlayer = match.players.some((p) => p.userId === userId);
        if (!isPlayer) {
            throw new Error(NOT_A_PLAYER_MSG);
        }

        await removeMatchPlayerSocket(matchId, userId, socket.id);
        await clearUserCurrentMatch(userId);

        match = removePlayerFromMatch(match, userId);
        const { gameId, players } = match;

        const lobbyKey = getLobbyRoomKey(gameId);

        if (players.length > 0) {
            io.to(lobbyKey).emit(
                "lobby:match-updated",
                summarizeMatchState(match),
            );
            await saveAndBroadcastMatchState({ io, match });
        } else {
            io.to(lobbyKey).emit("lobby:match-deleted", matchId);
            await deleteMatch({ matchId, gameId });
        }
    };

    const playerDisconnect = async () => {
        const { userId } = socket.data;
        const currentMatch = await getUserCurrentMatch(userId);
        if (!userId || !currentMatch) {
            return;
        }

        const { matchId: currMatchId } = currentMatch;
        let match = await getMatchState({ matchId: currMatchId });
        if (!match) {
            return;
        }

        await removeMatchPlayerSocket(currMatchId, userId, socket.id);
        const matchPlayerSockets = await getMatchPlayerSockets(
            currMatchId,
            userId,
        );
        if (!matchPlayerSockets || !matchPlayerSockets.length) {
            if (match.status !== "PLAYING") {
                await leaveMatch(match.id);
            } else {
                match = updatePlayerStatus(match, userId, "OFFLINE");
                await saveAndBroadcastMatchState({ io, match });

                const to = setTimeout(async () => {
                    match = endGameByDisconnect(match, userId);
                    saveEndedMatchToDb({ match, endedAt: Date.now() });
                    await clearUserCurrentMatch(userId);
                    await saveAndBroadcastMatchState({ io, match });
                }, DISCONNECT_TIMEOUT);

                disconnectTimeouts.set(userId, to);
            }
        }
    };

    socket.on("match:create", handleEvent(createNewMatch));
    socket.on("match:join", handleEvent(joinMatch));
    socket.on("match:start", handleEvent(startMatch));
    socket.on("match:action", handleEvent(processAction));
    socket.on("match:leave", handleEvent(leaveMatch));
    socket.on("disconnect", handleEvent(playerDisconnect));
};
