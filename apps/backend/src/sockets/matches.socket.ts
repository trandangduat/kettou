import {
    removeUserFromMatch,
    Match,
    GameRegistry,
    addUserToMatch,
    sanitizeMatchStateForClient,
} from "@mini-games/core";
import {
    createMatch,
    deleteMatch,
    getMatchState,
    saveEndedMatch,
    saveMatch,
    setMatchState,
} from "../services/matches.services.js";
import type { SocketHandlerContext } from "./types.js";
import { Server } from "socket.io";
import { getLobbyRoomKey, getUserRoomKey } from "./utils.js";
import { getCurrentUser } from "../services/auth.services.js";

const NOT_A_PLAYER_MSG =
    "You must be a player of this match to perform such actions.";

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
    const createNewMatch = async ({ gameId, matchType }, ack: any) => {
        console.log("CREATE NEW MATCH");
        try {
            const match = await createMatch({ gameId, matchType });
            io.to(getLobbyRoomKey(gameId)).emit("match:created", match.id);
            ack({ ok: true, matchId: match.id });
        } catch (err) {
            console.error(err);
            ack({ ok: false, error: String(err) });
        }
    };

    const joinMatch = async (matchId: string, ack: any) => {
        console.log("JOIN MATCH");
        try {
            const { userId } = socket.data;
            let user = getCurrentUser(userId);
            let match = await getMatchState({ matchId });
            match = addUserToMatch(match, user);

            await saveAndBroadcastMatchState({ io, match });
            ack({ ok: true });
        } catch (err) {
            console.error(err);
            ack({ ok: false, error: String(err) });
        }
    };

    const processAction = async ({ matchId, action }, ack: any) => {
        console.log("PROCESS ACTION: ", action.type);
        try {
            action.userId = socket.data.userId;

            let match = await getMatchState({ matchId });
            if (!match) {
                throw new Error("Match not found");
            }

            const engine = GameRegistry.getEngine(match.gameId);
            const res = engine.processAction(match, action);
            if (!res.isValid) {
                throw res.error;
            }

            match = res.newState;
            if (action.type === "START_MATCH") {
                saveMatch({ match, startedAt: Date.now() });
            }
            if (match.status === "ENDED") {
                saveEndedMatch({ match, endedAt: Date.now() });
            }
            await saveAndBroadcastMatchState({ io, match });
            ack({ ok: true });
        } catch (err) {
            console.error(err);
            ack({ ok: false, error: String(err) });
        }
    };

    const leaveMatch = async (matchId: string, ack: any) => {
        console.log("LEAVE MATCH");
        try {
            const { userId } = socket.data;
            let match = await getMatchState({ matchId });
            let isPlayer = match.players.some((p) => p.userId === userId);
            if (!isPlayer) {
                throw new Error(NOT_A_PLAYER_MSG);
            }
            match = removeUserFromMatch(match, userId);
            const { gameId, players } = match;
            // if no players remaining
            if (!players.length) {
                await deleteMatch({ matchId, gameId });
                io.to(getLobbyRoomKey(gameId)).emit("match:deleted", matchId);
                return;
            }
            await saveAndBroadcastMatchState({ io, match });
            ack({ ok: true });
        } catch (err) {
            console.error(err);
            ack({ ok: false, error: String(err) });
        }
    };

    socket.on("match:create", createNewMatch);
    socket.on("match:join", joinMatch);
    socket.on("match:action", processAction);
    socket.on("match:leave", leaveMatch);
};
