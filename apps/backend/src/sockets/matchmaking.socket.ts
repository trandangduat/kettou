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
import { getCurrentUser } from "../services/auth.services.js";
import { getMatchmakingRoomKey, getUserRoomKey } from "./utils.js";

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
            status: "ONLINE"
        });
        match.players.push({
            username: playerB.username,
            userId: playerB.userId,
            elo: playerB.elo,
            status: "ONLINE"
        });
        match = updateReadyStatus(match);
        await setMatchState({ matchId: match.id, matchState: match });

        // remove players from matchmaking room
        // and announce user that they have been matched
        for (let player of match.players) {
            const { userId } = player;
            const userRoomKey = getUserRoomKey(userId);
            const sockets = await io.in(userRoomKey).fetchSockets();
            for (let s of sockets) {
                s.leave(getMatchmakingRoomKey(gameId));
            }
            io.to(userRoomKey).emit("matchmaking:found", match.id)
        }
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
    const joinMatchmaking = async (gameId: string, ack: any) => {
        socket.join(getMatchmakingRoomKey(gameId));

        const { userId } = socket.data;
        const { elo, username } = getCurrentUser(userId);

        const player = {
            userId,
            elo,
            username,
            joinedAt: Date.now(),
        };
        await addToMatchmakingQueue({ gameId, player });
        ack(true);
    };
    const leaveMatchmaking = async (gameId: string, ack: any) => {
        const { userId } = socket.data;

        socket.leave(getMatchmakingRoomKey(gameId));
        await removeFromMatchmakingQueue({ gameId, userId });
        ack(true);
    };
    socket.on("matchmaking:join", joinMatchmaking);
    socket.on("matchmaking:leave", leaveMatchmaking);
};
