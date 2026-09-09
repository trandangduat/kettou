import { getMatchesSummaryInLobby } from "../services/matches.services.js";
import type { SocketHandlerContext } from "./types.js";
import { getLobbyRoomKey, handleEvent } from "./utils.js";

export const setupLobbySocket = ({ io, socket }: SocketHandlerContext) => {
    const joinLobby = async (gameId: string) => {
        console.log("JOIN LOBBY", gameId, socket.id);

        let lobbyRoom = getLobbyRoomKey(gameId);
        socket.join(lobbyRoom);

        const matchSummaries = await getMatchesSummaryInLobby(gameId);
        socket.emit("lobby:matches-updated", matchSummaries);
    };

    const leaveLobby = async (gameId: string) => {
        console.log("LEAVE LOBBY", gameId, socket.id);

        let lobbyRoom = getLobbyRoomKey(gameId);
        socket.leave(lobbyRoom);
    };

    socket.on("lobby:join", handleEvent(joinLobby));
    socket.on("lobby:leave", handleEvent(leaveLobby));
};
