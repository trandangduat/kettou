import type { Server } from "socket.io";
import { debugRoom, getRoomKey, type Room } from "shared";
import { setRoomState } from "../redis.js";

export const saveAndBroadcastRoomState = async ({
    io,
    room,
}: {
    io: Server;
    room: Room;
}) => {
    const roomId = room.id;
    io.to(getRoomKey(roomId)).emit("room:update", room);
    debugRoom(room);
    await setRoomState({ roomId, roomState: room });
};
