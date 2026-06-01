import { getRoomKey, updateRoomReadyStatus } from "shared";
import { createRoom, deleteRoom, getRoomState } from "../redis.js";
import { saveAndBroadcastRoomState } from "./room-state.js";
import type { SocketHandlerContext } from "./types.js";

export const setupRoomsSocket = ({ io, socket }: SocketHandlerContext) => {
    const createNewRoom = async ({ gameId, matchType }, ack) => {
        try {
            const room = await createRoom({ gameId, matchType });
            io.to(`lobby:${gameId}`).emit("room:create", {
                roomId: room.id,
            });
            ack({ roomId: room.id });
        } catch (err) {
            ack({ roomId: null });
        }
    };

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
            await saveAndBroadcastRoomState({ io, room });
        } catch (err) {}
    };

    const leaveRoom = async ({ roomId, user }) => {
        console.log("LEAVE ROOM");
        socket.leave(getRoomKey(roomId));
        try {
            let room = await getRoomState({ roomId });
            const { gameId, players } = room;
            const leftPlayerId = players.findIndex((p) => p.userId === user.id);
            if (leftPlayerId >= 0) {
                players.splice(leftPlayerId, 1);
            }
            // no players left
            if (players.length === 0) {
                await deleteRoom({ roomId, gameId });
                io.to(`lobby:${gameId}`).emit("room:leave", {
                    roomId,
                });
                return;
            }
            room = updateRoomReadyStatus({ room });
            await saveAndBroadcastRoomState({ io, room });
        } catch (err) {}
    };

    const getRoomInfo = async ({ roomId }, ack) => {
        console.log("GET ROOM INFO");
        try {
            let room = await getRoomState({ roomId });
            ack(room);
        } catch (err) {}
    };

    socket.on("room:get-info", getRoomInfo);
    socket.on("room:create", createNewRoom);
    socket.on("room:join", joinRoom);
    socket.on("room:leave", leaveRoom);
};
