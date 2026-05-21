import { getRoom } from "#/api/rooms";
import { socket } from "#/socket";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { GameState } from "shared";
import { GameBoard } from "./-components/game-board";

export const Route = createFileRoute("/_protected/rooms/$roomId/")({
    loader: async ({ context, params }) => {
        const roomId = params.roomId;
        const room = await context.queryClient.ensureQueryData({
            queryKey: ["room", roomId],
            queryFn: () => getRoom(roomId),
        });
        return room;
    },
    component: RouteComponent,
});

function RouteComponent() {
    const room = Route.useLoaderData();
    const { user } = Route.useRouteContext();
    const [gameState, setGameState] = useState<GameState>();
    const [waitingDice, setWaitingDice] = useState<boolean>(false);
    const myTurn: boolean =
        gameState?.turn === 0
            ? user.userId === gameState?.player1?.id
            : user.userId === gameState?.player2?.id;
    let myDiceNumber = 0;
    if (
        gameState &&
        gameState.roundNumber > 0 &&
        gameState.rounds?.length === gameState.roundNumber
    ) {
        myDiceNumber = gameState.rounds[gameState.roundNumber - 1].diceNumber;
    }

    const startGame = () => {
        socket.emit("start game", {
            roomId: room.id,
            userId: user.userId,
        });
    };

    const rollDice = () => {
        setWaitingDice(true);
        setTimeout(() => {
            socket.emit("roll dice", {
                roomId: room.id,
                userId: user.userId,
            });
            setWaitingDice(false);
        }, 1000);
    };

    useEffect(() => {
        socket.emit("join room", {
            roomId: room.id,
            user: {
                username: user.username,
                id: user.userId,
            },
        });

        socket.on("update gamestate", (newState) => {
            setGameState(newState);
        });

        return () => {
            socket.emit("leave room", {
                roomId: room.id,
                user: {
                    username: user.username,
                    id: user.userId,
                },
            });
        };
    }, []);
    return (
        <>
            <h1>{room.id}</h1>
            <p>{room.game_id}</p>
            <p>
                Player 1:
                {gameState && gameState.player1
                    ? gameState.player1.username
                    : "NULL"}
            </p>
            <p>
                Player 2:
                {gameState && gameState.player2
                    ? gameState.player2.username
                    : "NULL"}
            </p>
            <button
                onClick={startGame}
                className="p-2 border"
                style={{
                    backgroundColor:
                        gameState?.canStart &&
                        gameState?.player1?.id == user.userId
                            ? "cyan"
                            : "grey",
                }}
            >
                Start Game
            </button>
            <p>
                isPlaying:
                <b
                    style={{
                        color: gameState?.isPlaying ? "green" : "red",
                    }}
                >
                    {gameState?.isPlaying ? "true" : "false"}
                </b>
            </p>
            {gameState?.isPlaying && (
                <div>
                    {myTurn ? (
                        <>
                            <p>
                                It is <b>your turn</b> now!
                            </p>
                            <button
                                className="p-2 border mb-4"
                                onClick={rollDice}
                            >
                                Roll dice
                            </button>
                            {waitingDice && <p>Rolling dices...</p>}
                            {myDiceNumber > 0 && (
                                <p>
                                    Your dice lands on <b>{myDiceNumber}</b>
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <p>
                                Waiting for <b>enemy's turn</b>
                            </p>
                        </>
                    )}
                </div>
            )}
            <div className="flex flex-col m-auto">
                <div>Enemy</div>
                <GameBoard
                    gameState={gameState}
                    myDiceNumber={myDiceNumber}
                    myTurn={myTurn}
                />
                <div>You</div>
            </div>
        </>
    );
}
