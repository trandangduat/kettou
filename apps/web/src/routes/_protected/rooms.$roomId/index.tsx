import { getRoom } from "#/api/rooms";
import { socket } from "#/socket";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { initRoom, type Room } from "shared";
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
    const [roomState, setRoomState] = useState<Room>(initRoom());
    const {
        status: gameStatus,
        players,
        roundNumber,
        rounds,
        turn,
        endState,
    } = roomState;
    const [waitingDice, setWaitingDice] = useState<boolean>(false);
    const myTurn: boolean =
        gameStatus === "PLAYING" && user.userId === players[turn].userId;
    let myDiceNumber = 0;
    if (roundNumber > 0 && rounds.length === roundNumber) {
        myDiceNumber = rounds[roundNumber - 1].diceNumber;
    }
    const playerPoints = endState?.playerPoints;
    let isAWinner = false;

    if (gameStatus === "ENDED") {
        isAWinner =
            (user.userId === players[0].userId &&
                playerPoints![user.userId] >
                    playerPoints![players[1].userId]) ||
            (user.userId === players[1].userId &&
                playerPoints![user.userId] > playerPoints![players[0].userId]);
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
        if (roomState?.status === "WAITING") {
            socket.emit("join room", {
                roomId: room.id,
                user: {
                    username: user.username,
                    id: user.userId,
                },
            });
        }

        socket.on("update room", (newState) => {
            setRoomState(newState);
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
            {Array.from({ length: 2 }).map((_, i) => {
                return (
                    <div key={i}>
                        Player {i + 1}:{" "}
                        {i + 1 > players.length ? "-" : players[i].username}
                    </div>
                );
            })}
            <button
                onClick={startGame}
                className="p-2 border"
                style={{
                    backgroundColor:
                        gameStatus === "READY" &&
                        user.userId === players[0].userId
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
                        color: gameStatus === "PLAYING" ? "green" : "red",
                    }}
                >
                    {gameStatus === "PLAYING" ? "true" : "false"}
                </b>
            </p>
            {gameStatus === "PLAYING" && (
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
            <div className="flex flex-col m-auto bg-gray-200">
                <div>Enemy</div>
                <GameBoard
                    roomState={roomState}
                    myDiceNumber={myDiceNumber}
                    myTurn={myTurn}
                />
                <div>You</div>
            </div>
            {gameStatus === "ENDED" && (
                <>
                    {isAWinner ? "Winner" : "Loser"}
                    <p>Points: {playerPoints?.[user.userId]}</p>
                </>
            )}
        </>
    );
}
