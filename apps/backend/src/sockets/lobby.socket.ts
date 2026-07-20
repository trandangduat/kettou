import { getAllMatchesInLobby } from "../services/matches.services.js";
import type { SocketHandlerContext } from "./types.js";
import { getLobbyRoomKey, handleEvent } from "./utils.js";

export const setupLobbySocket = ({ io, socket }: SocketHandlerContext) => {
    const joinLobby = async (gameId: string) => {
        console.log("JOIN LOBBY", gameId, socket.id);

        let lobbyRoom = getLobbyRoomKey(gameId);
        socket.join(lobbyRoom);
        const matchIds = await getAllMatchesInLobby({ gameId });
        io.to(lobbyRoom).emit("lobby:matches-updated", matchIds);
    };

    socket.on("lobby:join", handleEvent(joinLobby));
};
