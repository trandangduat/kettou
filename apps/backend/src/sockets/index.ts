import type { Server } from "socket.io";
import { getRandomNumber } from "../utils.js";
import { initRoom, GameMove, Room } from "shared";
import { getRoomState, setRoomState } from "../redis.js";

const getRoomKey = (roomId: string) => {
    return `room:${roomId}`;
};

const saveRoomState = async ({
    io,
    room,
    roomId,
}: {
    io: Server;
    room: Room;
    roomId: string;
}) => {
    io.to(getRoomKey(roomId)).emit("update room", room);
    debugRoom(room);
    await setRoomState({ roomId, roomState: room });
};

const updateRoomReadyStatus = ({ room }: { room: Room }): Room => {
    if (room.players.length === 2) {
        room.status = "READY";
    } else {
        room.status = "WAITING";
    }
    return room;
};

const moveOnToNextRound = ({ room }: { room: Room }): Room => {
    if (room.roundNumber > 0) {
        room.roundNumber++;
        room.turn = 1 - room.turn;
    }
    return room;
};

const endGame = ({ room }: { room: Room }): Room => {
    console.log("END GAME ACTUALLY");
    const { rounds } = room;
    const points: Record<string, number> = {};

    for (let { playerId, move } of rounds) {
        points[playerId] ??= 0;
        points[playerId] += move ? move.len * move.len : 0;
    }

    room = {
        ...room,
        status: "ENDED",
        endState: {
            playerPoints: points,
        },
    };
    return room;
};

const debugRoom = (room: Room) => {
    console.log("room:", JSON.stringify(room, null, 2));
};

const checkValidMove = ({
    currentMove,
    userId,
    room,
}: {
    currentMove: GameMove;
    userId: number;
    room: Room;
}): boolean => {
    return true;
};

export const setUpSocket = (io: Server) => {
    io.on("connection", (socket) => {
        console.log("socket connected: ", socket.id);

        socket.on("join room", async ({ roomId, user }) => {
            console.log("JOIN ROOM");
            socket.join(getRoomKey(roomId));
            let room = await getRoomState({ roomId });
            room ??= initRoom();

            if (room.players.find((player) => player.userId === user.id)) {
                return;
            }
            room.players.push({
                username: user.username,
                userId: user.id,
            });
            room = updateRoomReadyStatus({ room });
            await saveRoomState({ io, room, roomId });
        });

        socket.on("leave room", async ({ roomId, user }) => {
            console.log("LEAVE ROOM");
            socket.leave(getRoomKey(roomId));
            let room = await getRoomState({ roomId });
            room ??= initRoom();

            const { players } = room;
            const leftPlayerId = players.findIndex((p) => p.userId === user.id);
            if (leftPlayerId >= 0) {
                players.splice(leftPlayerId, 1);
            }
            if (players.length === 0) {
                room = initRoom();
                return;
            }
            room = updateRoomReadyStatus({ room });
            await saveRoomState({ io, room, roomId });
        });

        socket.on("start game", async ({ roomId, userId }) => {
            console.log("START GAME");
            let room = await getRoomState({ roomId });
            room ??= initRoom();
            if (room.status === "READY" && userId === room.players[0].userId) {
                room = {
                    ...room,
                    roundNumber: 1,
                    status: "PLAYING",
                    turn: getRandomNumber(2),
                };
            }
            await saveRoomState({ io, room, roomId });
        });

        socket.on("roll dice", async ({ roomId, userId }) => {
            console.log("ROLL DICE");
            let room = await getRoomState({ roomId });
            room ??= initRoom();
            room.rounds.push({
                move: null,
                diceNumber: getRandomNumber(6) + 1,
                playerId: userId,
            });
            await saveRoomState({ io, room, roomId });
        });

        socket.on("finish move", async ({ roomId, userId, move }) => {
            console.log("FINISH MOVE");
            let room = await getRoomState({ roomId });
            room ??= initRoom();
            const { roundNumber } = room;
            if (
                roundNumber > 0 &&
                checkValidMove({
                    currentMove: move,
                    userId,
                    room,
                })
            ) {
                room.rounds[roundNumber - 1].move = move;
                room = moveOnToNextRound({ room });
            } else {
                console.log("Not a valid move, move again!");
            }

            await saveRoomState({ io, room, roomId });
        });

        socket.on("cannot move", async ({ roomId, userId }) => {
            console.log("CANNOT MOVE");
            let room = await getRoomState({ roomId });
            room ??= initRoom();
            const { roundNumber } = room;

            // if the other player could not move as well
            if (roundNumber > 1 && !room.rounds[roundNumber - 2].move) {
                room = endGame({ room });
            } else {
                room = moveOnToNextRound({ room });
            }

            await saveRoomState({ io, room, roomId });
        });

        socket.on("disconnect", () => {
            console.log("socket disconnected: ", socket.id);
        });
    });
};
