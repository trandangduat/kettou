import { socket } from "#/socket";
import { useState, type Dispatch, type SetStateAction } from "react";
import { GameBoard } from "./game-board";
import type {
    DiceTerritoryEngine,
    MatchState,
} from "@mini-games/game-dice-territory";

type MatchViewParams = {
    match: MatchState;
    setMatch: Dispatch<SetStateAction<MatchState>>;
    user: any;
    engine: DiceTerritoryEngine;
};

export function MatchView({ match, setMatch, user, engine }: MatchViewParams) {
    const [waitingDice, setWaitingDice] = useState<boolean>(false);

    const { status, players, gameState, endState } = match;
    const { roundNumber, rounds, turn } = gameState;

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
        playerPoints = endState!.scores!;
        isAWinner = user.id == endState!.winnerId;
    }

    const rollDice = () => {
        setWaitingDice(true);
        setTimeout(() => {
            socket.emit(
                "match:action",
                {
                    matchId: match.id,
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

    return (
        <>
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
                    user={user}
                    match={match}
                    myDiceNumber={myDiceNumber}
                    myTurn={myTurn}
                    engine={engine}
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
