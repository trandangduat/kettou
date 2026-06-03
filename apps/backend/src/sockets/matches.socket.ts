import {
    addMove,
    endMatch,
    moveOnToNextRound,
    type Move,
    type Room,
} from "shared";
import { getRoomState } from "../redis.js";
import { saveEndedMatch, createMatch } from "../services/matches.services.js";
import { getRandomNumber } from "../utils.js";
import { saveAndBroadcastRoomState } from "./room-state.js";
import type { SocketHandlerContext } from "./types.js";

const checkValidMove = ({
    currentMove,
    userId,
    room,
}: {
    currentMove: Move;
    userId: string;
    room: Room;
}): boolean => {
    return true;
};

export const setupMatchesSocket = ({ io, socket }: SocketHandlerContext) => {
    const startMatch = async ({ roomId, userId }, ack) => {
        console.log("START MATCH");
        let room = await getRoomState({ roomId });
        let startedAt = Date.now();
        try {
            if (room.status === "READY" && userId === room.players[0].userId) {
                room = {
                    ...room,
                    roundNumber: 1,
                    status: "PLAYING",
                    turn: getRandomNumber(2),
                };
                ack({ ok: true });
            }
            await saveAndBroadcastRoomState({ io, room });
            // create the match in database
            createMatch({ room, type: room.matchType, startedAt });
        } catch (err) {}
    };

    const rollDice = async ({ roomId, userId }) => {
        console.log("ROLL DICE");
        let room = await getRoomState({ roomId });
        try {
            room.rounds.push({
                move: null,
                diceNumber: getRandomNumber(6) + 1,
                playerId: userId,
            });
            await saveAndBroadcastRoomState({ io, room });
        } catch (err) {}
    };

    const finishMove = async ({ roomId, userId, move }) => {
        console.log("FINISH MOVE");
        let room = await getRoomState({ roomId });
        try {
            const { roundNumber } = room;
            if (
                roundNumber > 0 &&
                checkValidMove({
                    currentMove: move,
                    userId,
                    room,
                })
            ) {
                room = addMove({ room, move });
            } else {
                console.log("Not a valid move, move again!");
            }

            await saveAndBroadcastRoomState({ io, room });
        } catch (err) {}
    };

    const cannotMove = async ({ roomId, userId }) => {
        console.log("CANNOT MOVE");
        let room = await getRoomState({ roomId });
        try {
            const { roundNumber } = room;

            // if the other player could not move as well
            if (roundNumber > 1 && !room.rounds[roundNumber - 2].move) {
                let endedAt = Date.now();
                room = endMatch({ room });
                // update the match in database
                saveEndedMatch({ room, endedAt });
            } else {
                room = moveOnToNextRound({ room });
            }

            await saveAndBroadcastRoomState({ io, room });
        } catch (err) {}
    };

    socket.on("match:start", startMatch);
    socket.on("match:roll-dice", rollDice);
    socket.on("match:finish-move", finishMove);
    socket.on("match:cannot-move", cannotMove);
};
