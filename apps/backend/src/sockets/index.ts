import type { Server } from "socket.io";
import { GameStateDict, gameStates } from "./gameStates.js";
import { getRandomNumber } from "../utils.js";
import { createInitGameState, GameMove, GameState } from "shared";
import e from "cors";

const updateRoomStatus = (gameStates: GameStateDict, roomId: string) => {
    if (gameStates[roomId].players.length === 2) {
        gameStates[roomId].status = "READY";
    } else {
        gameStates[roomId].status = "WAITING";
    }
};

const moveOnToNextRound = (gameStates: GameStateDict, roomId: string) => {
    const roundNumber = gameStates[roomId].roundNumber;
    if (roundNumber > 0) {
        gameStates[roomId].roundNumber++;
        gameStates[roomId].turn = 1 - gameStates[roomId].turn;
    }
};

const endGame = (gameStates: GameStateDict, roomId: string) => {
    const rounds = gameStates[roomId].rounds;
    const points: Record<string, number> = {};

    for (let { playerId, move } of rounds) {
        points[playerId] ??= 0;
        points[playerId] += move ? move.len * move.len : 0;
    }

    gameStates[roomId] = {
        ...gameStates[roomId],
        status: "ENDED",
        endState: {
            playerPoints: points,
        },
    };
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
                gameStates[roomId].players.find(
                    (player) => player.userId === user.id,
                )
            ) {
                return;
            }
            gameStates[roomId].players.push({
                username: user.username,
                userId: user.id,
            });
            updateRoomStatus(gameStates, roomId);
            io.to(roomStr).emit("update gamestate", gameStates[roomId]);
            debugGameStates(gameStates);
        });

        socket.on("leave room", ({ roomId, user }) => {
            // console.log("user ", user.username, " leave room ", roomId);
            const roomStr = `room:${roomId}`;
            socket.leave(roomStr);
            gameStates[roomId] ??= createInitGameState();
            const players = gameStates[roomId].players;
            const leftPlayerId = players.findIndex((p) => p.userId === user.id);
            if (leftPlayerId >= 0) {
                players.splice(leftPlayerId, 1);
            }
            if (players.length === 0) {
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
                gameStates[roomId].status === "READY" &&
                userId === gameStates[roomId].players[0].userId
            ) {
                gameStates[roomId] = {
                    ...gameStates[roomId],
                    roundNumber: 1,
                    status: "PLAYING",
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
                moveOnToNextRound(gameStates, roomId);
            } else {
                console.log("Not a valid move, move again!");
            }

            io.to(roomStr).emit("update gamestate", gameStates[roomId]);
            debugGameStates(gameStates);
        });

        socket.on("cannot move", ({ roomId, userId }) => {
            console.log("cannot move socket ");
            const roomStr = `room:${roomId}`;
            gameStates[roomId] ??= createInitGameState();
            const roundNumber = gameStates[roomId].roundNumber;

            // if the other player could not move as well
            if (
                roundNumber > 1 &&
                !gameStates[roomId].rounds[roundNumber - 2].move
            ) {
                endGame(gameStates, roomId);
            } else {
                moveOnToNextRound(gameStates, roomId);
            }

            io.to(roomStr).emit("update gamestate", gameStates[roomId]);
            debugGameStates(gameStates);
        });

        socket.on("disconnect", () => {
            console.log("socket disconnected: ", socket.id);
        });
    });
};
