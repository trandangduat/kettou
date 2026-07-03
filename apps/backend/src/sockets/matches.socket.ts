import {
    addMove,
    debugMatch,
    endMatch,
    Match,
    moveOnToNextRound,
    updateMatchReadyStatus,
    type Move,
} from "shared";
import {
    createMatch,
    deleteMatch,
    getMatchKey,
    getMatchState,
    saveEndedMatch,
    saveMatch,
    setMatchState,
} from "../services/matches.services.js";
import { getRandomNumber } from "../utils.js";
import type { SocketHandlerContext } from "./types.js";
import { Server } from "socket.io";

const NOT_A_PLAYER_MSG =
    "You must be a player of this match to perform such actions.";
const INVALID_MOVE_MSG = "Invalid move. Move again";
const NOT_YOUR_TURN_MSG = "It is not your turn.";
const GAME_NOT_STARTED_MSG = "Game has not started yet.";

const checkValidMove = ({
    currentMove,
    userId,
    match,
}: {
    currentMove: Move;
    userId: string;
    match: Match;
}): boolean => {
    return true;
};

export const saveAndBroadcastMatchState = async ({
    io,
    match,
}: {
    io: Server;
    match: Match;
}) => {
    const matchId = match.id;
    io.to(getMatchKey(matchId)).emit("match:updated", match);
    debugMatch(match);
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
            if (match.players.find((player) => player.userId === user.id)) {
                return;
            }
            match.players.push({
                username: user.username,
                userId: user.id,
                elo: user.elo,
            });
            match = updateMatchReadyStatus({ match });
            await saveAndBroadcastMatchState({ io, match });
            ack({ ok: true });
        } catch (err) {
            ack({ ok: false, error: err });
        }
    };

    const startMatch = async ({ matchId, userId }, ack) => {
        console.log("PLAYER START MATCH");
        try {
            let match = await getMatchState({ matchId });
            let startedAt = Date.now();
            let isHost = userId === match.players[0].userId;
            if (match.status === "READY" && isHost) {
                let turn = getRandomNumber(2);
                match = {
                    ...match,
                    roundNumber: 1,
                    status: "PLAYING",
                    turn: turn,
                };
                await saveAndBroadcastMatchState({ io, match });
                // save the match in database
                saveMatch({ match, type: match.matchType, startedAt });
            } else {
                throw new Error(
                    "Sorry! You are not allowed to start this match.",
                );
            }
            ack({ ok: true });
        } catch (err) {
            ack({ ok: false, error: err });
        }
    };

    const rollDice = async ({ matchId, userId }, ack) => {
        console.log("PLAYER ROLL DICE");
        try {
            let match = await getMatchState({ matchId });
            let isPlayer = match.players.some((p) => p.userId === userId);
            let isPlayerTurn = userId === match.players[match.turn].userId;
            if (!isPlayer) {
                throw new Error(NOT_A_PLAYER_MSG);
            }
            if (match.roundNumber == 0) {
                throw new Error(GAME_NOT_STARTED_MSG);
            }
            if (!isPlayerTurn) {
                throw new Error(NOT_YOUR_TURN_MSG);
            }
            let diceNumber = getRandomNumber(6) + 1;
            match.rounds.push({
                move: null,
                diceNumber: diceNumber,
                playerId: userId,
            });
            await saveAndBroadcastMatchState({ io, match });
            ack({ ok: true, diceNumber: diceNumber });
        } catch (err) {
            ack({ ok: false, error: err });
        }
    };

    const submitMove = async ({ matchId, userId, move }, ack) => {
        console.log("PLAYER SUBMIT MOVE");
        try {
            let match = await getMatchState({ matchId });
            let isPlayer = match.players.some((p) => p.userId === userId);
            let isPlayerTurn = userId === match.players[match.turn].userId;
            if (!isPlayer) {
                throw new Error(NOT_A_PLAYER_MSG);
            }
            if (match.roundNumber == 0) {
                throw new Error(GAME_NOT_STARTED_MSG);
            }
            if (!isPlayerTurn) {
                throw new Error(NOT_YOUR_TURN_MSG);
            }
            if (
                !checkValidMove({
                    currentMove: move,
                    userId: userId,
                    match: match,
                })
            ) {
                throw new Error(INVALID_MOVE_MSG);
            }

            console.log("####@@@@##VCERYFIEUFBEKB");

            match = addMove({ match, move });
            match = moveOnToNextRound({ match });
            await saveAndBroadcastMatchState({ io, match });
            ack({ ok: true });
        } catch (err) {
            ack({ ok: false, error: err });
        }
    };

    const cannotMove = async ({ matchId, userId }, ack) => {
        console.log("PLAYER CANNOT MOVE");
        try {
            let match = await getMatchState({ matchId });
            let isPlayer = match.players.some((p) => p.userId === userId);
            let isPlayerTurn = userId === match.players[match.turn].userId;
            if (!isPlayer) {
                throw new Error(NOT_A_PLAYER_MSG);
            }
            if (match.roundNumber == 0) {
                throw new Error(GAME_NOT_STARTED_MSG);
            }
            if (!isPlayerTurn) {
                throw new Error(NOT_YOUR_TURN_MSG);
            }
            const { roundNumber } = match;
            const lastPlayerCannotMove =
                roundNumber > 1 && !match.rounds[roundNumber - 2].move;

            if (lastPlayerCannotMove) {
                let endedAt = Date.now();
                match = endMatch({ match });
                // update the match in database
                saveEndedMatch({ match, endedAt });
            } else {
                match = moveOnToNextRound({ match });
            }

            await saveAndBroadcastMatchState({ io, match });
            ack({ ok: true });
        } catch (err) {
            ack({ ok: false, error: err.message });
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
            const { gameId, players } = match;
            const removedPlayer = players.findIndex((p) => p.userId === userId);
            if (removedPlayer >= 0) {
                players.splice(removedPlayer, 1);
            }
            // no players remaining
            if (!players.length) {
                await deleteMatch({ matchId, gameId });
                io.to(`lobby:${gameId}`).emit("match:deleted", {
                    matchId,
                });
                return;
            }
            match = updateMatchReadyStatus({ match });
            await saveAndBroadcastMatchState({ io, match });
            ack({ ok: true });
        } catch (err) {
            ack({ ok: false, error: err });
        }
    };

    const getMatchInfo = async ({ matchId }, ack) => {
        console.log("GET MATCH INFO");
        try {
            let match = await getMatchState({ matchId });
            ack({ ok: true, match });
        } catch (err) {
            ack({ ok: false, error: err });
        }
    };

    socket.on("match:create", createNewMatch);
    socket.on("match:join", joinMatch);
    socket.on("match:start", startMatch);
    socket.on("match:roll-dice", rollDice);
    socket.on("match:submit-move", submitMove);
    socket.on("match:cannot-move", cannotMove);
    socket.on("match:get-info", getMatchInfo);
    socket.on("match:leave", leaveMatch);
};
