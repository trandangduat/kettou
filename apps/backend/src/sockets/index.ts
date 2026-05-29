import type { Server } from "socket.io";
import { getRandomNumber } from "../utils.js";
import {
    GameMove,
    Room,
    getRoomKey,
    updateRoomReadyStatus,
    debugRoom,
    moveOnToNextRound,
    endGame,
    addMove,
} from "shared";
import {
    deleteRoom,
    getRoomState,
    setRoomState,
    createRoom,
    getAllRoomsInLobby,
} from "../redis.js";

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

const checkValidMove = ({
    currentMove,
    userId,
    room,
}: {
    currentMove: GameMove;
    userId: string;
    room: Room;
}): boolean => {
    return true;
};

export const setUpSocket = (io: Server) => {
    io.on("connection", (socket) => {
        console.log("socket connected: ", socket.id);

        const joinRoom = async ({ roomId, user }) => {
            console.log("JOIN ROOM");
            socket.join(getRoomKey(roomId));
            try {
                let room = await getRoomState({ roomId });
                if (room.players.find((player) => player.userId === user.id)) {
                    return;
                }
                room.players.push({
                    username: user.username,
                    userId: user.id,
                });
                room = updateRoomReadyStatus({ room });
                await saveRoomState({ io, room, roomId });
            } catch (err) {}
        };

        const leaveRoom = async ({ roomId, user }) => {
            console.log("LEAVE ROOM");
            socket.leave(getRoomKey(roomId));
            try {
                let room = await getRoomState({ roomId });
                const { gameId, players } = room;
                const leftPlayerId = players.findIndex(
                    (p) => p.userId === user.id,
                );
                if (leftPlayerId >= 0) {
                    players.splice(leftPlayerId, 1);
                }
                // no players left
                if (players.length === 0) {
                    await deleteRoom({ roomId, gameId });
                    io.to(`lobby:${gameId}`).emit("room deleted", {
                        roomId,
                    });
                    return;
                }
                room = updateRoomReadyStatus({ room });
                await saveRoomState({ io, room, roomId });
            } catch (err) {}
        };

        const startGame = async ({ roomId, userId }, ack) => {
            console.log("START GAME");
            let room = await getRoomState({ roomId });
            try {
                if (
                    room.status === "READY" &&
                    userId === room.players[0].userId
                ) {
                    room = {
                        ...room,
                        roundNumber: 1,
                        status: "PLAYING",
                        turn: getRandomNumber(2),
                    };
                    ack({ ok: true });
                }
                await saveRoomState({ io, room, roomId });
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
                await saveRoomState({ io, room, roomId });
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

                await saveRoomState({ io, room, roomId });
            } catch (err) {}
        };
        const cannotMove = async ({ roomId, userId }) => {
            console.log("CANNOT MOVE");
            let room = await getRoomState({ roomId });
            try {
                const { roundNumber } = room;

                // if the other player could not move as well
                if (roundNumber > 1 && !room.rounds[roundNumber - 2].move) {
                    room = endGame({ room });
                } else {
                    room = moveOnToNextRound({ room });
                }

                await saveRoomState({ io, room, roomId });
            } catch (err) {}
        };

        const createNewRoom = async ({ gameId }, ack) => {
            try {
                const room = await createRoom({ gameId });
                io.to(`lobby:${gameId}`).emit("room created", {
                    roomId: room.id,
                });
                ack({ roomId: room.id });
            } catch (err) {
                ack({ roomId: null });
            }
        };

        const joinRoomsUpdate = async ({ gameId }) => {
            console.log("JOIN ROOM UPDATE", socket.id);
            socket.join(`lobby:${gameId}`);
            const roomsId = await getAllRoomsInLobby({ gameId });
            io.to(`lobby:${gameId}`).emit("rooms snapshot", { roomsId });
        };

        socket.on("join rooms update", joinRoomsUpdate);
        socket.on("create room", createNewRoom);
        socket.on("join room", joinRoom);
        socket.on("leave room", leaveRoom);
        socket.on("start game", startGame);
        socket.on("roll dice", rollDice);
        socket.on("finish move", finishMove);
        socket.on("cannot move", cannotMove);
        socket.on("disconnect", () => {
            console.log("socket disconnected: ", socket.id);
        });
    });
};
