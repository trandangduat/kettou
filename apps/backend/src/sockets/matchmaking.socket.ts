import type { SocketHandlerContext } from "./types.js";
import { Server } from "socket.io";
import { logger } from "../logger.js";
import {
    addPlayerToMmQueue,
    getPairsInMmQueue,
    removePlayerFromMmQueue,
    removePairsFromMmQueue,
} from "../services/matchmaking.services.js";
import {
    createMatch,
    setMatchState,
} from "../services/matches.services.js";
import { getCurrentUser } from "../services/auth.services.js";
import { getUserRoomKey } from "./utils.js";
import { getUserEloOfGames } from "../services/games.services.js";
import { MATCHMAKING_DEBOUNCE } from "../config.js";

const processMatchmakingQueue = async (io: Server) => {
    const pairs = await getPairsInMmQueue();

    for (let pair of pairs) {
        logger.info(pair, "MATCHED: ");
        const { player1Id, player2Id, gameId } = pair;
        let match = await createMatch({ gameId, matchType: "RANKED" });
        await setMatchState({ matchId: match.id, matchState: match });

        io.to(getUserRoomKey(player1Id)).emit("matchmaking:found", match.id, gameId);
        io.to(getUserRoomKey(player2Id)).emit("matchmaking:found", match.id, gameId);
    }

    await removePairsFromMmQueue(pairs);
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
            await processMatchmakingQueue(io);
        } finally {
            isProcessing = false;
        }
    }, MATCHMAKING_DEBOUNCE);
};

export const setUpMatchmakingSocket = ({
    io,
    socket,
}: SocketHandlerContext) => {
    const joinMatchmaking = async (gameIds: string[], ack: any) => {
        const { userId } = socket.data;
        const player = {
            userId,
            elos: getUserEloOfGames(userId, gameIds),
            joinedAt: Date.now(),
        };
        await addPlayerToMmQueue({ gameIds, player });
        ack(true);
    };

    const leaveMatchmaking = async (ack: any) => {
        const { userId } = socket.data;
        await removePlayerFromMmQueue(userId);
        ack(true);
    };

    socket.on("matchmaking:join", joinMatchmaking);
    socket.on("matchmaking:leave", leaveMatchmaking);
};
