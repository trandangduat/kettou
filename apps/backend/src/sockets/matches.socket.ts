import {
    removePlayerFromMatch,
    Match,
    GameRegistry,
    addPlayerToMatch,
    sanitizeMatchStateForClient,
    Player,
    updatePlayerStatus,
    NOT_HOST_MSG,
    abandonMatch,
    updateReadyStatus,
} from "@mini-games/core";
import {
    clearUserCurrentMatch,
    createMatch,
    deleteMatch,
    getMatchState,
    getUserCurrentMatch,
    saveEndedMatchToDb,
    saveMatchToDb,
    saveUserCurrentMatch,
    saveMatchState,
    summarizeMatchState,
} from "../services/matches.services.js";
import type { SocketHandlerContext } from "./types.js";
import { Server } from "socket.io";
import {
    debugRooms,
    getLobbyRoom,
    getMatchUserRoom,
    getUserRoom,
    handleEvent,
} from "./utils.js";
import { getUserById } from "../services/auth.services.js";
import { getUserEloOfGame } from "../services/games.services.js";
import { DISCONNECT_TIMEOUT } from "../config.js";
import { withMatchLock, removeMatchLock } from "../services/lock.services.js";

const NOT_A_PLAYER_MSG =
    "You must be a player of this match to perform such actions.";

const disconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();

export const setupMatchesSocket = ({ io, socket }: SocketHandlerContext) => {
    const saveAndBroadcastMatchState = async (match: Match<any>) => {
        const { id: matchId, players } = match;

        await saveMatchState(match);

        for (const { userId } of players) {
            // convert the match state to the client's perspective
            // so that the client only sees their own state, not the state of all players
            const matchForUser = sanitizeMatchStateForClient(match, userId);
            io.to(getMatchUserRoom(matchId, userId)).emit(
                "match:updated",
                matchForUser,
            );
        }
    };

    const handleEndedMatch = async (match: Match<any>) => {
        saveEndedMatchToDb({ match, endedAt: Date.now() });

        for (let player of match.players) {
            io.to(getUserRoom(player.userId)).emit(
                "current-match:updated",
                null,
            );
            await clearUserCurrentMatch(player.userId);

            const matchUserRoom = getMatchUserRoom(match.id, player.userId);
            io.in(matchUserRoom).socketsLeave(matchUserRoom);
        }
    };

    const createNewMatch = async ({ gameId, matchType }) => {
        console.log("CREATE NEW MATCH");

        const match = await createMatch({ gameId, matchType });
        const lobbyKey = getLobbyRoom(gameId);
        io.to(lobbyKey).emit(
            "lobby:new-match-created",
            summarizeMatchState(match),
        );
        return { matchId: match.id };
    };

    const handleNewPlayerJoin = async (
        match: Match<any>,
        userId: string,
    ): Promise<Match<any>> => {
        let user = getUserById(userId);
        let newPlayer: Player = {
            userId: user.id,
            status: "ONLINE",
            avatarUrls: user.avatarUrls,
            elo: getUserEloOfGame(userId, match.gameId),
        };
        match = addPlayerToMatch(match, newPlayer);

        io.to(getLobbyRoom(match.gameId)).emit(
            "lobby:match-updated",
            summarizeMatchState(match),
        );
        socket.to(getUserRoom(userId)).emit("current-match:updated", {
            gameId: match.gameId,
            matchId: match.id,
        });
        await saveUserCurrentMatch(userId, match.gameId, match.id);

        return match;
    };

    const handlePlayerReconnect = async (
        match: Match<any>,
        userId: string,
    ): Promise<Match<any>> => {
        // cancel abandon countdown
        let timeout = disconnectTimeouts.get(userId);
        if (timeout) {
            clearTimeout(timeout);
            disconnectTimeouts.delete(userId);
        }

        // update player status
        match = updatePlayerStatus(match, userId, "ONLINE");
        return match;
    };

    const joinMatch = async (matchId: string) => {
        return await withMatchLock(matchId, async () => {
            console.log("JOIN MATCH");

            const { userId } = socket.data;
            let match = await getMatchState({ matchId });
            if (!match) {
                throw new Error(`Match #${matchId} not found`);
            }

            let isExistingPlayer = match.players.some((p) => p.userId === userId);

            if (!isExistingPlayer && match.players.length === 2) {
                throw new Error(`Match #${matchId} is full`);
            }

            // leave the game lobby room
            socket.leave(getLobbyRoom(match.gameId));
            // join the match user room
            socket.join(getMatchUserRoom(matchId, userId));

            if (!isExistingPlayer) {
                match = await handleNewPlayerJoin(match, userId);
            } else {
                match = await handlePlayerReconnect(match, userId);
            }

            await saveAndBroadcastMatchState(match);
            debugRooms(io);
        });
    };

    const startMatch = async (matchId: string) => {
        return await withMatchLock(matchId, async () => {
            console.log("START MATCH: ", matchId);

            const { userId } = socket.data;
            let match = await getMatchState({ matchId });
            if (!match) {
                throw new Error(`Match #${matchId} not found`);
            }

            let isPlayer = match.players.some((p) => p.userId === userId);
            let isHost = match.players[0].userId === userId;
            let isWaiting = match.status === "WAITING";
            if (!isPlayer) {
                throw new Error(NOT_A_PLAYER_MSG);
            }
            if (!isHost) {
                throw new Error(NOT_HOST_MSG);
            }
            if (isWaiting) {
                throw new Error("Match is not ready yet.");
            }

            const engine = GameRegistry.getEngine(match.gameId);
            match = engine.getInitialMatchState(match);
            match.status = "PLAYING";

            saveMatchToDb({ match, startedAt: Date.now() });
            await saveAndBroadcastMatchState(match);
        });
    };

    const processAction = async ({ matchId, action }) => {
        return await withMatchLock(matchId, async () => {
            console.log("PROCESS ACTION: ", action.type);

            action.userId = socket.data.userId;
            let match = await getMatchState({ matchId });
            if (!match) {
                throw new Error(`Match #${matchId} not found`);
            }

            const engine = GameRegistry.getEngine(match.gameId);
            const res = engine.processAction(match, action);
            if (!res.isValid) {
                throw new Error(res.error);
            }

            match = res.newState;
            await saveAndBroadcastMatchState(match);

            if (match.status === "ENDED") {
                await handleEndedMatch(match);
            }

            return { data: res.data };
        });
    };

    const leaveMatch = async (matchId: string) => {
        return await withMatchLock(matchId, async () => {
            console.log("LEAVE MATCH: ", matchId);

            const { userId } = socket.data;

            const timeout = disconnectTimeouts.get(userId);
            if (timeout) {
                clearTimeout(timeout);
                disconnectTimeouts.delete(userId);
            }

            let match = await getMatchState({ matchId });
            if (!match) {
                throw new Error(`Match #${matchId} not found`);
            }

            let isPlayer = match.players.some((p) => p.userId === userId);
            if (!isPlayer) {
                throw new Error(NOT_A_PLAYER_MSG);
            }
            if (match.status !== "PLAYING") {
                // remove player from match state and broadcast new match state
                match = removePlayerFromMatch(match, userId);
                await saveAndBroadcastMatchState(match);

                // broadcast to user's other clients in the match that the user has left
                const matchUserRoom = getMatchUserRoom(matchId, userId);
                socket.to(matchUserRoom).emit("user:left-match", matchId);
                io.in(matchUserRoom).socketsLeave(matchUserRoom);

                // broadcast to user's clients that the current match has updated
                await clearUserCurrentMatch(userId);
                const userRoom = getUserRoom(userId);
                io.to(userRoom).emit("current-match:updated", null);

                const lobbyKey = getLobbyRoom(match.gameId);
                if (match.players.length > 0) {
                    io.to(lobbyKey).emit(
                        "lobby:match-updated",
                        summarizeMatchState(match),
                    );
                } else {
                    io.to(lobbyKey).emit("lobby:match-deleted", matchId);
                    await deleteMatch({ matchId, gameId: match.gameId });
                    removeMatchLock(matchId);
                }
            } else {
                // end match because player abandoned
                match = abandonMatch(match, userId);
                await saveAndBroadcastMatchState(match);
                await handleEndedMatch(match);
            }
            debugRooms(io);
        });
    };

    const playerDisconnect = async () => {
        const { userId } = socket.data;
        const currentMatch = await getUserCurrentMatch(userId);
        if (!userId || !currentMatch) {
            return;
        }

        const { matchId } = currentMatch;

        await withMatchLock(matchId, async () => {
            let match = await getMatchState({ matchId });
            if (!match) {
                return;
            }

            const playerClients = await io
                .in(getMatchUserRoom(matchId, userId))
                .fetchSockets();

            if (playerClients.length) {
                return;
            }

            match = updatePlayerStatus(match, userId, "OFFLINE");
            await saveAndBroadcastMatchState(match);

            const tout = setTimeout(async () => {
                console.log("🥀🥀🥀 Leave match because of abandon");
                await leaveMatch(matchId);
                disconnectTimeouts.delete(userId);
            }, DISCONNECT_TIMEOUT);

            disconnectTimeouts.set(userId, tout);
            debugRooms(io);
        });
    };

    socket.on("match:create", handleEvent(createNewMatch));
    socket.on("match:join", handleEvent(joinMatch));
    socket.on("match:start", handleEvent(startMatch));
    socket.on("match:action", handleEvent(processAction));
    socket.on("match:leave", handleEvent(leaveMatch));
    socket.on("disconnect", handleEvent(playerDisconnect));
};
