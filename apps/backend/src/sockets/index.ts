import type { Server } from "socket.io";
import { createInitGameState, GameStateDict } from "./gameStates.js";

const updateRoomStatus = (gameStates: GameStateDict, roomId: string) => {
    if (gameStates[roomId].player1 && gameStates[roomId].player2) {
        gameStates[roomId].canStart = true;
        gameStates[roomId].isPlaying = false;
    } else {
        gameStates[roomId].canStart = false;
        gameStates[roomId].isPlaying = false;
    }
};

export const setUpSocket = (io: Server, gameStates: GameStateDict) => {
    io.on("connection", (socket) => {
        console.log("socket connected: ", socket.id);

        socket.on("join room", ({ roomId, user }) => {
            const roomStr = `room:${roomId}`;
            socket.join(roomStr);
            gameStates[roomId] ??= createInitGameState();
            if (
                gameStates[roomId].player1?.username === user.username ||
                gameStates[roomId].player2?.username === user.username
            ) {
                return;
            }
            if (!gameStates[roomId].player1) {
                gameStates[roomId] = {
                    ...gameStates[roomId],
                    player1: {
                        username: user.username,
                        id: user.id,
                        moves: [],
                    },
                };
            } else if (!gameStates[roomId].player2) {
                gameStates[roomId] = {
                    ...gameStates[roomId],
                    player2: {
                        username: user.username,
                        id: user.id,
                        moves: [],
                    },
                };
            } else {
                gameStates[roomId] = {
                    ...gameStates[roomId],
                    waitingQueues: [
                        {
                            username: user.username,
                            id: user.id,
                            moves: [],
                        },
                        ...(gameStates[roomId].waitingQueues ?? []),
                    ],
                };
            }
            updateRoomStatus(gameStates, roomId);
            io.to(roomStr).emit("update gamestate", gameStates[roomId]);
            console.log("gameStates", gameStates);
        });

        socket.on("leave room", ({ roomId, user }) => {
            // console.log("user ", user.username, " leave room ", roomId);
            const roomStr = `room:${roomId}`;
            socket.leave(roomStr);
            gameStates[roomId] ??= createInitGameState();
            // player1 is basically the room host, so if player1 left,
            // promote the remaining player to room host
            if (gameStates[roomId].player1?.username === user.username) {
                gameStates[roomId].player1 = gameStates[roomId].player2;
                gameStates[roomId].player2 =
                    gameStates[roomId].waitingQueues?.pop();
            }
            if (gameStates[roomId].player2?.username === user.username) {
                gameStates[roomId].player2 =
                    gameStates[roomId].waitingQueues?.pop();
            }
            updateRoomStatus(gameStates, roomId);
            io.to(roomStr).emit("update gamestate", gameStates[roomId]);
            console.log("gameStates", gameStates);
        });

        socket.on("start game", ({ roomId, userId }) => {
            const roomStr = `room:${roomId}`;
            gameStates[roomId] ??= createInitGameState();
            console.log(
                roomId,
                userId,
                gameStates[roomId].canStart,
                gameStates[roomId].player1?.id,
            );
            if (
                gameStates[roomId].canStart &&
                userId === gameStates[roomId].player1?.id
            ) {
                gameStates[roomId] = {
                    ...gameStates[roomId],
                    canStart: false,
                    isPlaying: true,
                };
            }
            io.to(roomStr).emit("update gamestate", gameStates[roomId]);
            console.log("gameStates", gameStates);
        });

        socket.on("disconnect", () => {
            console.log("socket disconnected: ", socket.id);
        });
    });
};
