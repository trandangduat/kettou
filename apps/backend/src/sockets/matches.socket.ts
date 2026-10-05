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
    DISCONNECT_TIMEOUT,
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
    removeReconnectDeadline,
    addReconnectDeadline,
    getExpiredReconnectDeadlines,
} from "../services/matches.services.js";
import type { SocketHandlerContext } from "./types.js";
import { Server, Socket } from "socket.io";
import {
    debugRooms,
    getLobbyRoom,
    getMatchUserRoom,
    getUserRoom,
    handleEvent,
} from "./utils.js";
import { getUserById } from "../services/auth.services.js";
import { getUserEloOfGame } from "../services/games.services.js";
import { withMatchLock, removeMatchLock } from "../services/lock.services.js";
import { logger } from "../logger.js";

const NOT_A_PLAYER_MSG =
    "You must be a player of this match to perform such actions.";

export const startReconnectDeadlinesWorker = (io: Server) => {
    let running = false;
    setInterval(async () => {
        if (running) {
            return;
        }

        // logger.info("🔥PROCESSING RECONNECT DEADLINES");

        try {
            const expiredDeadlines = await getExpiredReconnectDeadlines();
            for (let item of expiredDeadlines) {
                let tmp = item.split(":");
                let userId = tmp[0];
                let matchId = tmp[1];
                console.log("dddddeadline", userId, matchId);
                await leaveMatch(io, userId, matchId);
            }
        } finally {
            running = false;
        }
    }, 1000);
};

const leaveMatch = async (io: Server, userId: string, matchId: string) => {
    let match = await getMatchState({ matchId });
    if (!match) {
        throw new Error(`Match #${matchId} not found`);
    }

    let isPlayer = match.players.some((p) => p.userId === userId);
    if (!isPlayer) {
        throw new Error(NOT_A_PLAYER_MSG);
    }

    await removeReconnectDeadline(userId, matchId);

    if (match.status !== "PLAYING") {
        // remove player from match state and broadcast new match state
        match = removePlayerFromMatch(match, userId);
        await saveAndBroadcastMatchState(io, match);

        // broadcast to user's other clients in the match that the user has left
        const matchUserRoom = getMatchUserRoom(matchId, userId);
        io.in(matchUserRoom).socketsLeave(matchUserRoom);

        // broadcast to user's clients that their current match has updated
        await clearUserCurrentMatch(userId);
        io.to(getUserRoom(userId)).emit("current-match:updated", null);

        // update match status in game lobby
        if (match.players.length > 0) {
            io.to(getLobbyRoom(match.gameId)).emit(
                "lobby:match-updated",
                summarizeMatchState(match),
            );
        } else {
            io.to(getLobbyRoom(match.gameId)).emit("lobby:match-deleted", matchId);
            await removeMatch(match.id, match.gameId);
        }
    } else {
        // end match because player abandoned
        match = abandonMatch(match, userId);
        await saveAndBroadcastMatchState(io, match);
        await handleEndedMatch(io, match);
    }

    debugRooms(io);
};

const removeMatch = async (matchId: string, gameId: string) => {
    await deleteMatch({ matchId, gameId });
    removeMatchLock(matchId);
}

const handleEndedMatch = async (io: Server, match: Match<any>) => {
    saveEndedMatchToDb({ match, endedAt: Date.now() });

    for (let player of match.players) {
        io.to(getUserRoom(player.userId)).emit("current-match:updated", null);
        await clearUserCurrentMatch(player.userId);

        const matchUserRoom = getMatchUserRoom(match.id, player.userId);
        io.in(matchUserRoom).socketsLeave(matchUserRoom);
    }

    io.to(getLobbyRoom(match.gameId)).emit("lobby:match-deleted", match.id);
    await removeMatch(match.id, match.gameId);
};

const saveAndBroadcastMatchState = async (io: Server, match: Match<any>) => {
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

export const setupMatchesSocket = ({ io, socket }: SocketHandlerContext) => {
    const createNewMatch = async ({ gameId, matchType }) => {
        console.log("CREATE NEW MATCH");

        let currentMatch = await getUserCurrentMatch(socket.data.userId);
        if (currentMatch) {
            throw new Error(
                `You are already in a match with id #${currentMatch.matchId}.\n
                Leave the current match first before creating a new match.`
            );
        }

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
        // remove user's reconnect deadline
        await removeReconnectDeadline(userId, match.id);

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

            let currentMatch = await getUserCurrentMatch(userId);
            if (currentMatch && currentMatch.matchId !== matchId) {
                throw new Error(
                    `You are already in a match with id #${currentMatch.matchId}.\n
                    If you want to join a different match, please leave the current match first.`
                );
            }

            let isExistingPlayer = match.players.some(
                (p) => p.userId === userId,
            );

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

            await saveAndBroadcastMatchState(io, match);
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
            await saveAndBroadcastMatchState(io, match);
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
            await saveAndBroadcastMatchState(io, match);

            if (match.status === "ENDED") {
                await handleEndedMatch(io, match);
            }

            return { data: res.data };
        });
    };

    const handleLeaveMatch = async (matchId: string) => {
        return await withMatchLock(matchId, async () => {
            console.log("LEAVE MATCH: ", matchId);

            const { userId } = socket.data;
            socket.to(getUserRoom(userId)).emit("user:left-match", matchId);
            await leaveMatch(io, userId, matchId);
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

            const disconnectedAt = Date.now();

            await addReconnectDeadline(
                userId,
                matchId,
                disconnectedAt + DISCONNECT_TIMEOUT,
            );

            match = updatePlayerStatus(
                match,
                userId,
                "OFFLINE",
                disconnectedAt,
            );
            await saveAndBroadcastMatchState(io, match);

            debugRooms(io);
        });
    };

    socket.on("match:create", handleEvent(createNewMatch));
    socket.on("match:join", handleEvent(joinMatch));
    socket.on("match:start", handleEvent(startMatch));
    socket.on("match:action", handleEvent(processAction));
    socket.on("match:leave", handleEvent(handleLeaveMatch));
    socket.on("disconnect", handleEvent(playerDisconnect));
};
