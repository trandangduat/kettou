import { getRoomKey, updateRoomReadyStatus } from "shared";
import {
    addToMatchmakingQueue,
    createRoom,
    getMatchesInMmQueue,
    removeFromMatchmakingQueue,
    removeMatchesFromMmQueue,
    setRoomState,
} from "../redis.js";
import type { SocketHandlerContext } from "./types.js";
import { Server } from "socket.io";
import { logger } from "../logger.js";

const getMatchmakingKey = (gameId: string) => {
    return `matchmaking:${gameId}`;
};

const processMatchmakingQueue = async ({
    io,
    gameId,
}: {
    io: Server;
    gameId: string;
}) => {
    const matches = await getMatchesInMmQueue({ gameId });

    for (let match of matches) {
        console.log("MATCH", match);
        const { playerA, playerB } = match;
        let room = await createRoom({ gameId, matchType: "RANKED" });
        room.players.push({
            username: playerA.username,
            userId: playerA.userId,
            elo: playerA.elo,
        });
        room.players.push({
            username: playerB.username,
            userId: playerB.userId,
            elo: playerB.elo,
        });
        room = updateRoomReadyStatus({ room });
        await setRoomState({ roomId: room.id, roomState: room });

        const socketA = io.sockets.sockets.get(playerA.socketId);
        const socketB = io.sockets.sockets.get(playerB.socketId);

        const mmKey = getMatchmakingKey(gameId);
        socketA?.leave(mmKey);
        socketB?.leave(mmKey);

        const roomKey = getRoomKey(room.id);
        socketA?.join(roomKey);
        socketB?.join(roomKey);

        io.to(roomKey).emit("matchmaking:matched", { room });
    }

    await removeMatchesFromMmQueue({ gameId, matches });
};

export const startMatchMakingWorker = (io: Server) => {
    let isProcessing: boolean = false;
    setInterval(async () => {
        if (isProcessing) {
            return;
        }
        isProcessing = true;
        try {
            logger.info("PROCESSING MM QUEUE");
            await processMatchmakingQueue({ io, gameId: "dice-territory" });
        } finally {
            isProcessing = false;
        }
    }, 8000);
};

export const setUpMatchmakingSocket = ({
    io,
    socket,
}: SocketHandlerContext) => {
    const joinMatchmaking = async ({ gameId, user }, ack) => {
        socket.join(getMatchmakingKey(gameId));
        user = {
            ...user,
            socketId: socket.id,
            joinedAt: Date.now(),
        };
        await addToMatchmakingQueue({ gameId, user });
        ack(true);
    };
    const leaveMatchmaking = async ({ gameId, user }, ack) => {
        socket.leave(getMatchmakingKey(gameId));
        await removeFromMatchmakingQueue({ gameId, user });
        ack(true);
    };
    socket.on("matchmaking:join", joinMatchmaking);
    socket.on("matchmaking:leave", leaveMatchmaking);
};
