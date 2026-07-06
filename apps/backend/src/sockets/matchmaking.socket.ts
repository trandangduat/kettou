import type { SocketHandlerContext } from "./types.js";
import { Server } from "socket.io";
import { logger } from "../logger.js";
import {
    addToMatchmakingQueue,
    getPairsInMmQueue,
    removeFromMatchmakingQueue,
    removePairsFromMmQueue,
} from "../services/matchmaking.services.js";
import {
    createMatch,
    getMatchKey,
    setMatchState,
} from "../services/matches.services.js";
import { updateReadyStatus } from "@mini-games/core";

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
    const pairs = await getPairsInMmQueue({ gameId });

    for (let pair of pairs) {
        logger.info(pair, "MATCHED: ");
        const { playerA, playerB } = pair;
        let match = await createMatch({ gameId, matchType: "RANKED" });
        match.players.push({
            username: playerA.username,
            userId: playerA.userId,
            elo: playerA.elo,
        });
        match.players.push({
            username: playerB.username,
            userId: playerB.userId,
            elo: playerB.elo,
        });
        match = updateReadyStatus(match);
        await setMatchState({ matchId: match.id, matchState: match });

        const socketA = io.sockets.sockets.get(playerA.socketId);
        const socketB = io.sockets.sockets.get(playerB.socketId);

        const mmKey = getMatchmakingKey(gameId);
        socketA?.leave(mmKey);
        socketB?.leave(mmKey);

        const matchKey = getMatchKey(match.id);
        socketA?.join(matchKey);
        socketB?.join(matchKey);

        io.to(matchKey).emit("matchmaking:found", { match });
    }

    await removePairsFromMmQueue({ gameId, pairs });
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
    }, 2000);
};

export const setUpMatchmakingSocket = ({
    io,
    socket,
}: SocketHandlerContext) => {
    const joinMatchmaking = async ({ gameId, user }, ack) => {
        socket.join(getMatchmakingKey(gameId));
        const { id, elo, username } = user;
        const player = {
            userId: id,
            elo,
            username,
            socketId: socket.id,
            joinedAt: Date.now(),
        };
        await addToMatchmakingQueue({ gameId, player });
        ack(true);
    };
    const leaveMatchmaking = async ({ gameId, user }, ack) => {
        socket.leave(getMatchmakingKey(gameId));
        await removeFromMatchmakingQueue({ gameId, userId: user.id });
        ack(true);
    };
    socket.on("matchmaking:join", joinMatchmaking);
    socket.on("matchmaking:leave", leaveMatchmaking);
};
