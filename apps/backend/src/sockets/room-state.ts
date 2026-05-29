import type { Server } from "socket.io";
import { debugRoom, getRoomKey, type Room } from "shared";
import { setRoomState } from "../redis.js";

export const saveRoomState = async ({
    io,
    room,
    roomId,
}: {
    io: Server;
    room: Room;
    roomId: string;
}) => {
    io.to(getRoomKey(roomId)).emit("room:update", room);
    debugRoom(room);
    await setRoomState({ roomId, roomState: room });
};
