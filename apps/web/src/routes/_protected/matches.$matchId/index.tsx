import { socket } from "#/socket";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { initMatch, type Match } from "shared";
import { GameBoard } from "./-components/game-board";

export const Route = createFileRoute("/_protected/matches/$matchId/")({
    component: RouteComponent,
});

function RouteComponent() {
    const { matchId } = Route.useParams();
    const { user } = Route.useRouteContext();
    const [match, setMatch] = useState<Match>(
        initMatch({ gameId: "", matchType: "CUSTOM" }),
    );
    const [waitingStart, setWaitingStart] = useState<boolean>(false);
    const [waitingDice, setWaitingDice] = useState<boolean>(false);

    const {
        status: gameStatus,
        players,
        roundNumber,
        rounds,
        turn,
        endState,
    } = match;
    let myTurn: boolean = false;
    let myDiceNumber: number = 0;
    let playerPoints: Record<string, number> = {};
    let isAWinner = false;
    if (gameStatus === "PLAYING") {
        myTurn = user.id === players[turn].userId;
    }
    if (myTurn && roundNumber > 0 && rounds.length === roundNumber) {
        myDiceNumber = rounds[roundNumber - 1].diceNumber;
    }
    if (gameStatus === "ENDED") {
        playerPoints = endState!.playerPoints;
        isAWinner = user.id == endState!.winnerUserId;
    }

    const startGame = () => {
        setWaitingStart(true);
        socket.emit(
            "match:start",
            {
                matchId,
                userId: user.id,
            },
            ({ ok }: { ok: boolean }) => {
                if (ok) setWaitingStart(false);
            },
        );
    };

    const rollDice = () => {
        setWaitingDice(true);
        setTimeout(() => {
            socket.emit("match:roll-dice", {
                matchId,
                userId: user.id,
            });
            setWaitingDice(false);
        }, 1000);
    };

    useEffect(() => {
        socket.emit("match:get-info", { matchId }, (match: Match) => {
            setMatch(match);
        });
        socket.emit("match:join", {
            matchId,
            user: {
                username: user.username,
                id: user.id,
            },
        });

        socket.on("match:updated", (newState) => {
            setMatch(newState);
        });

        return () => {
            socket.emit("match:leave", {
                matchId,
                user: {
                    username: user.username,
                    id: user.id,
                },
            });
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
                    onClick={startGame}
                    className="p-2 border"
                    style={{
                        backgroundColor:
                            gameStatus === "READY" &&
                            user.id === players[0].userId
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
                    match={match}
                    myDiceNumber={myDiceNumber}
                    myTurn={myTurn}
                    setMatch={setMatch}
                />
                <div>You</div>
            </div>
            {gameStatus === "ENDED" && (
                <>
                    {isAWinner ? "Winner" : "Loser"}
                    <p>Points: {playerPoints?.[user.id]}</p>
                </>
            )}
        </>
    );
}
