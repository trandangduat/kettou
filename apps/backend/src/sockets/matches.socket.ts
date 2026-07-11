import {
    removeUserFromMatch,
    Match,
    GameRegistry,
    addUserToMatch,
} from "@mini-games/core";
import {
    createMatch,
    deleteMatch,
    getMatchKey,
    getMatchState,
    saveEndedMatch,
    saveMatch,
    setMatchState,
} from "../services/matches.services.js";
import type { SocketHandlerContext } from "./types.js";
import { Server } from "socket.io";

const NOT_A_PLAYER_MSG =
    "You must be a player of this match to perform such actions.";

export const saveAndBroadcastMatchState = async ({
    io,
    match,
}: {
    io: Server;
    match: Match<any>;
}) => {
    const matchId = match.id;
    io.to(getMatchKey(matchId)).emit("match:updated", match);
    await setMatchState({ matchId: matchId, matchState: match });
};

export const setupMatchesSocket = ({ io, socket }: SocketHandlerContext) => {
    const createNewMatch = async ({ gameId, matchType }, ack) => {
        console.log("CREATE NEW MATCH");
        try {
            const match = await createMatch({ gameId, matchType });
            io.to(`lobby:${gameId}`).emit("match:created", {
                matchId: match.id,
            });
            ack({ ok: true, matchId: match.id });
        } catch (err) {
            ack({ ok: false, error: err });
        }
    };

    const joinMatch = async ({ matchId, user }, ack) => {
        console.log("JOIN MATCH");
        try {
            socket.join(getMatchKey(matchId));

            let match = await getMatchState({ matchId });
            match = addUserToMatch(match, user);

            await saveAndBroadcastMatchState({ io, match });
            ack({ ok: true });
        } catch (err) {
            ack({ ok: false, error: err });
        }
    };

    const processAction = async ({ matchId, action }, ack) => {
        console.log("PROCESS ACTION: ", action.type);
        try {
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
            ack({ ok: false, error: String(err) });
        }
    };

    const leaveMatch = async ({ matchId, userId }, ack) => {
        console.log("LEAVE MATCH");
        try {
            let match = await getMatchState({ matchId });
            let isPlayer = match.players.some((p) => p.userId === userId);
            if (!isPlayer) {
                throw new Error(NOT_A_PLAYER_MSG);
            }
            socket.leave(getMatchKey(matchId));
            match = removeUserFromMatch(match, userId);
            const { gameId, players } = match;
            // no players remaining
            if (!players.length) {
                await deleteMatch({ matchId, gameId });
                io.to(`lobby:${gameId}`).emit("match:deleted", {
                    matchId,
                });
                return;
            }
            await saveAndBroadcastMatchState({ io, match });
            ack({ ok: true });
        } catch (err) {
            ack({ ok: false, error: err });
        }
    };

    socket.on("match:create", createNewMatch);
    socket.on("match:join", joinMatch);
    socket.on("match:action", processAction);
    socket.on("match:leave", leaveMatch);
};
