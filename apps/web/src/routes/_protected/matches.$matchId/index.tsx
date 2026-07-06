import { socket } from "#/socket";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameBoard } from "./-components/game-board";
import { GameRegistry, type Match } from "@mini-games/core";

export const Route = createFileRoute("/_protected/matches/$matchId/")({
    component: RouteComponent,
});

function RouteComponent() {
    const { matchId } = Route.useParams();
    const { user } = Route.useRouteContext();
    const engine = GameRegistry.getEngine("dice-territory");
    const [match, setMatch] = useState<Match<any>>(
        engine.createNewMatchState("CUSTOM"),
    );
    const [waitingStart, setWaitingStart] = useState<boolean>(false);
    const [waitingDice, setWaitingDice] = useState<boolean>(false);

    const { status, players, gameState } = match;
    const { roundNumber, rounds, turn, endState } = gameState;

    let myTurn: boolean = false;
    let myDiceNumber: number = 0;
    let playerPoints: Record<string, number> = {};
    let isAWinner = false;
    if (status === "PLAYING") {
        myTurn = user.id === players[turn].userId;
    }
    if (myTurn && roundNumber > 0 && rounds.length === roundNumber) {
        myDiceNumber = rounds[roundNumber - 1].diceNumber;
    }
    if (status === "ENDED") {
        playerPoints = endState!.playerPoints;
        isAWinner = user.id == endState!.winnerUserId;
    }

    const startMatch = () => {
        setWaitingStart(true);
        socket.emit(
            "match:action",
            {
                matchId,
                action: {
                    type: "START_MATCH",
                    userId: user.id,
                },
            },
            ({ ok, error }: { ok: boolean; error?: string }) => {
                setWaitingStart(false);
                if (!ok) {
                    console.error(error);
                }
            },
        );
    };

    const rollDice = () => {
        setWaitingDice(true);
        setTimeout(() => {
            socket.emit(
                "match:action",
                {
                    matchId,
                    action: {
                        type: "ROLL_DICE",
                        userId: user.id,
                    },
                },
                ({ ok, error }: { ok: boolean; error?: string }) => {
                    if (!ok) {
                        console.log(error);
                    }
                },
            );
            setWaitingDice(false);
        }, 1000);
    };

    useEffect(() => {
        socket.emit(
            "match:join",
            { matchId, user },
            ({ ok, error }: { ok: boolean; error?: string }) => {
                if (!ok) {
                    console.log(error);
                }
            },
        );
        socket.on("match:updated", (updatedMatch) => {
            setMatch(updatedMatch);
        });

        return () => {
            socket.emit(
                "match:leave",
                {
                    matchId,
                    userId: user.id,
                },
                ({ ok, error }: { ok: boolean; error?: string }) => {
                    if (!ok) {
                        console.log(error);
                    }
                },
            );
        };
    }, []);
    return (
        <>
            <h1>{matchId}</h1>
            <p>{match.gameId}</p>
            {Array.from({ length: 2 }).map((_, i) => {
                return (
                    <div key={i}>
                        Player {i + 1}:{" "}
                        {i + 1 > players.length ? "-" : players[i].username}
                    </div>
                );
            })}
            <div className="flex flex-row">
                <button
                    onClick={startMatch}
                    className="p-2 border"
                    style={{
                        backgroundColor:
                            status === "READY" && user.id === players[0].userId
                                ? "cyan"
                                : "grey",
                    }}
                >
                    Start Game
                </button>
                {waitingStart && "Waiting game to start..."}
            </div>
            <p>
                isPlaying:
                <b
                    style={{
                        color: status === "PLAYING" ? "green" : "red",
                    }}
                >
                    {status === "PLAYING" ? "true" : "false"}
                </b>
            </p>
            {status === "PLAYING" && (
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
                    match={match}
                    myDiceNumber={myDiceNumber}
                    myTurn={myTurn}
                    setMatch={setMatch}
                />
                <div>You</div>
            </div>
            {status === "ENDED" && (
                <>
                    {isAWinner ? "Winner" : "Loser"}
                    <p>Points: {playerPoints?.[user.id]}</p>
                </>
            )}
        </>
    );
}
