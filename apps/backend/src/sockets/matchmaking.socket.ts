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
import { getUserRoomKey, handleEvent } from "./utils.js";
import { getUserEloOfGames } from "../services/games.services.js";
import { MATCHMAKING_DEBOUNCE } from "../config.js";
import { addPlayerToMatch, Player } from "@mini-games/core";
import { getUserById } from "../services/auth.services.js";

const processMatchmakingQueue = async (io: Server) => {
    const pairs = await getPairsInMmQueue();

    for (let pair of pairs) {
        logger.info(pair, "MATCHED: ");
        const { player1, player2, gameId } = pair;
        let match = await createMatch({ gameId, matchType: "RANKED" });

        match = addPlayerToMatch(match, player1);
        match = addPlayerToMatch(match, player2);

        await setMatchState({ matchId: match.id, matchState: match });

        io.to(getUserRoomKey(player1.userId)).emit("matchmaking:found", match.id, gameId);
        io.to(getUserRoomKey(player2.userId)).emit("matchmaking:found", match.id, gameId);
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
    const joinMatchmaking = async (gameIds: string[]) => {
        const { userId } = socket.data;
        const { username, avatarUrls } = getUserById(userId);
        const player = {
            userId,
            username,
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
};
