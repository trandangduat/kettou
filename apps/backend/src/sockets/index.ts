import type { Server } from "socket.io";
import { GameStateDict } from "./gameStates.js";
import { getRandomNumber } from "../utils.js";
import { createInitGameState, GameMove, GameState } from "shared";

const updateRoomStatus = (gameStates: GameStateDict, roomId: string) => {
    if (gameStates[roomId].player1 && gameStates[roomId].player2) {
        gameStates[roomId].canStart = true;
        gameStates[roomId].isPlaying = false;
    } else {
        gameStates[roomId].canStart = false;
        gameStates[roomId].isPlaying = false;
    }
};

const debugGameStates = (gameStates: GameStateDict) => {
    console.log("gameStates:", JSON.stringify(gameStates, null, 2));
};

const checkValidMove = ({
    currentMove,
    userId,
    gameState,
}: {
    currentMove: GameMove;
    userId: number;
    gameState: GameState;
}): boolean => {
    return true;
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
                    },
                };
            } else if (!gameStates[roomId].player2) {
                gameStates[roomId] = {
                    ...gameStates[roomId],
                    player2: {
                        username: user.username,
                        id: user.id,
                    },
                };
            } else {
                gameStates[roomId] = {
                    ...gameStates[roomId],
                    waitingQueues: [
                        {
                            username: user.username,
                            id: user.id,
                        },
                        ...(gameStates[roomId].waitingQueues ?? []),
                    ],
                };
            }
            updateRoomStatus(gameStates, roomId);
            io.to(roomStr).emit("update gamestate", gameStates[roomId]);
            debugGameStates(gameStates);
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
            if (!gameStates[roomId].player1 && !gameStates[roomId].player2) {
                gameStates[roomId] = undefined;
                return;
            }
            updateRoomStatus(gameStates, roomId);
            io.to(roomStr).emit("update gamestate", gameStates[roomId]);
            debugGameStates(gameStates);
        });

        socket.on("start game", ({ roomId, userId }) => {
            const roomStr = `room:${roomId}`;
            gameStates[roomId] ??= createInitGameState();
            if (
                gameStates[roomId].canStart &&
                userId === gameStates[roomId].player1?.id
            ) {
                gameStates[roomId] = {
                    ...gameStates[roomId],
                    roundNumber: 1,
                    canStart: false,
                    isPlaying: true,
                    turn: getRandomNumber(2),
                };
            }
            io.to(roomStr).emit("update gamestate", gameStates[roomId]);
            debugGameStates(gameStates);
        });

        socket.on("roll dice", ({ roomId, userId }) => {
            const roomStr = `room:${roomId}`;
            gameStates[roomId] ??= createInitGameState();
            gameStates[roomId].rounds.push({
                move: null,
                diceNumber: getRandomNumber(6) + 1,
                playerId: userId,
            });
            io.to(roomStr).emit("update gamestate", gameStates[roomId]);
            debugGameStates(gameStates);
        });

        socket.on("finish move", ({ roomId, userId, move }) => {
            const roomStr = `room:${roomId}`;
            gameStates[roomId] ??= createInitGameState();
            const roundNumber = gameStates[roomId].roundNumber;
            if (
                roundNumber > 0 &&
                checkValidMove({
                    currentMove: move,
                    userId,
                    gameState: gameStates[roomId],
                })
            ) {
                gameStates[roomId].rounds[roundNumber - 1].move = move;
                gameStates[roomId].roundNumber++;
                gameStates[roomId].turn = 1 - gameStates[roomId].turn;
            } else {
                console.log("Not a valid move, move again!");
            }
            io.to(roomStr).emit("update gamestate", gameStates[roomId]);
            debugGameStates(gameStates);
        });

        socket.on("disconnect", () => {
            console.log("socket disconnected: ", socket.id);
        });
    });
};
