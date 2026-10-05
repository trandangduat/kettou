import type { SocketHandlerContext } from "./types.js";
import { Server } from "socket.io";
import { logger } from "../logger.js";
import {
    addPlayerToMmQueue,
    getPairsInMmQueue,
    removePlayerFromMmQueue,
    removePairsFromMmQueue,
    checkPlayerInMmQueue,
} from "../services/matchmaking.services.js";
import {
    createMatch,
    saveMatchState,
} from "../services/matches.services.js";
import { getUserRoom, handleEvent } from "./utils.js";
import { getUserEloOfGames } from "../services/games.services.js";
import { MATCHMAKING_DEBOUNCE } from "../config.js";
import { addPlayerToMatch } from "@mini-games/core";
import { getUserById } from "../services/auth.services.js";

const processMatchmakingQueue = async (io: Server) => {
    const pairs = await getPairsInMmQueue();

    for (let pair of pairs) {
        logger.info(pair, "MATCHED: ");
        const { player1, player2, gameId } = pair;
        let match = await createMatch({ gameId, matchType: "RANKED" });

        match = addPlayerToMatch(match, player1);
        match = addPlayerToMatch(match, player2);

        await saveMatchState(match);

        io.to(getUserRoom(player1.userId)).emit("matchmaking:found", match.id, gameId);
        io.to(getUserRoom(player2.userId)).emit("matchmaking:found", match.id, gameId);
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
            // logger.info("PROCESSING MM QUEUE");
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
    const joinMatchmaking = async (gameIds: string[]) => {
        if (!gameIds.length) {
            throw new Error("You haven't chosen any games yet.")
        }
        const { userId } = socket.data;
        if (await checkPlayerInMmQueue(userId)) {
            throw new Error("IN_QUEUE_ALREADY")
        }

        const { avatarUrls } = getUserById(userId);
        const player = {
            userId,
            elos: getUserEloOfGames(userId, gameIds),
            joinedAt: Date.now(),
            avatarUrls
        };
        await addPlayerToMmQueue({ gameIds, player });
    };

    const leaveMatchmaking = async () => {
        const { userId } = socket.data;
        await removePlayerFromMmQueue(userId);
    };

    socket.on("matchmaking:join", handleEvent(joinMatchmaking));
    socket.on("matchmaking:leave", handleEvent(leaveMatchmaking));
    socket.on("disconnect", leaveMatchmaking);
};
