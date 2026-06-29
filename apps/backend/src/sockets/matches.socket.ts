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
    const startMatch = async ({ matchId, userId }, ack) => {
        console.log("START MATCH");
        let match = await getMatchState({ matchId });
        let startedAt = Date.now();
        try {
            if (
                match.status === "READY" &&
                userId === match.players[0].userId
            ) {
                match = {
                    ...match,
                    roundNumber: 1,
                    status: "PLAYING",
                    turn: getRandomNumber(2),
                };
                ack({ ok: true });
            }
            await saveAndBroadcastMatchState({ io, match });
            // save the match in database
            saveMatch({ match, type: match.matchType, startedAt });
        } catch (err) {}
    };

    const rollDice = async ({ matchId, userId }) => {
        console.log("ROLL DICE");
        let match = await getMatchState({ matchId });
        try {
            match.rounds.push({
                move: null,
                diceNumber: getRandomNumber(6) + 1,
                playerId: userId,
            });
            await saveAndBroadcastMatchState({ io, match });
        } catch (err) {}
    };

    const finishMove = async ({ matchId, userId, move }) => {
        console.log("FINISH MOVE");
        let match = await getMatchState({ matchId });
        try {
            const { roundNumber } = match;
            if (
                roundNumber > 0 &&
                checkValidMove({
                    currentMove: move,
                    userId,
                    match: match,
                })
            ) {
                match = addMove({ match, move });
            } else {
                console.log("Not a valid move, move again!");
            }

            await saveAndBroadcastMatchState({ io, match });
        } catch (err) {}
    };

    const cannotMove = async ({ matchId, userId }) => {
        console.log("CANNOT MOVE");
        let match = await getMatchState({ matchId });
        try {
            const { roundNumber } = match;

            // if the other player could not move as well
            if (roundNumber > 1 && !match.rounds[roundNumber - 2].move) {
                let endedAt = Date.now();
                match = endMatch({ match });
                // update the match in database
                saveEndedMatch({ match, endedAt });
            } else {
                match = moveOnToNextRound({ match });
            }

            await saveAndBroadcastMatchState({ io, match });
        } catch (err) {}
    };

    const createNewMatch = async ({ gameId, matchType }, ack) => {
        try {
            const match = await createMatch({ gameId, matchType });
            io.to(`lobby:${gameId}`).emit("match:created", {
                matchId: match.id,
            });
            ack({ matchId: match.id });
        } catch (err) {
            ack({ matchId: null });
        }
    };

    const joinMatch = async ({ matchId, user }) => {
        console.log("JOIN MATCH");
        socket.join(getMatchKey(matchId));
        try {
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
        } catch (err) {}
    };

    const leaveMatch = async ({ matchId, user }) => {
        console.log("LEAVE MATCH");
        socket.leave(getMatchKey(matchId));
        try {
            let match = await getMatchState({ matchId });
            const { gameId, players } = match;
            const leftPlayerId = players.findIndex((p) => p.userId === user.id);
            if (leftPlayerId >= 0) {
                players.splice(leftPlayerId, 1);
            }
            // no players left
            if (players.length === 0) {
                await deleteMatch({ matchId, gameId });
                io.to(`lobby:${gameId}`).emit("match:deleted", {
                    matchId,
                });
                return;
            }
            match = updateMatchReadyStatus({ match });
            await saveAndBroadcastMatchState({ io, match });
        } catch (err) {}
    };

    const getMatchInfo = async ({ matchId }, ack) => {
        console.log("GET MATCH INFO");
        try {
            let match = await getMatchState({ matchId });
            ack(match);
        } catch (err) {}
    };

    socket.on("match:start", startMatch);
    socket.on("match:roll-dice", rollDice);
    socket.on("match:finish-move", finishMove);
    socket.on("match:cannot-move", cannotMove);
    socket.on("match:get-info", getMatchInfo);
    socket.on("match:create", createNewMatch);
    socket.on("match:join", joinMatch);
    socket.on("match:leave", leaveMatch);
};
