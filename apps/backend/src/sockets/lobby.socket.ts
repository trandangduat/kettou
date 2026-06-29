import { getAllMatchesInLobby } from "../services/matches.services.js";
import type { SocketHandlerContext } from "./types.js";

export const setupLobbySocket = ({ io, socket }: SocketHandlerContext) => {
    const listMatches = async ({ gameId }) => {
        console.log("MATCHES LIST", socket.id);
        socket.join(`lobby:${gameId}`);
        const matchIds = await getAllMatchesInLobby({ gameId });
        io.to(`lobby:${gameId}`).emit("lobby:matches-update", {
            matchIds,
        });
    };

    socket.on("lobby:matches-update", listMatches);
};
