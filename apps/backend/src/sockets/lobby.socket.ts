import { getAllRoomsInLobby } from "../services/rooms.services.js";
import type { SocketHandlerContext } from "./types.js";

export const setupLobbySocket = ({ io, socket }: SocketHandlerContext) => {
    const listRooms = async ({ gameId }) => {
        console.log("ROOM LIST", socket.id);
        socket.join(`lobby:${gameId}`);
        const roomsId = await getAllRoomsInLobby({ gameId });
        io.to(`lobby:${gameId}`).emit("lobby:rooms-update", { roomsId });
    };

    socket.on("lobby:rooms-update", listRooms);
};
