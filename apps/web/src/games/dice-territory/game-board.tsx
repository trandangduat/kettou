import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { socket } from "#/socket";
import {
    calculateBoards,
    DiceTerritoryEngine,
    type DiceTerritoryAction,
    type MatchState,
    type Move,
} from "@mini-games/game-dice-territory";

interface GameBoardProps {
    user: any;
    match: MatchState;
    myTurn: boolean;
    myDiceNumber: number;
    engine: DiceTerritoryEngine;
    setMatch: Dispatch<SetStateAction<MatchState>>;
}

export function GameBoard({
    user,
    match,
    myDiceNumber,
    engine,
    setMatch,
}: GameBoardProps) {
    const [currentMove, setCurrentMove] = useState<Move>({
        r: 0,
        c: 0,
        len: -1,
    });
    const W = 8;
    const H = 8;
    const { board, isAValidMove } = useMemo(
        () => calculateBoards(W, H, match, user.id, myDiceNumber),
        [match, myDiceNumber],
    );

    const hoverOnCell = (r: number, c: number) => {
        if (isAValidMove[r][c]) {
            setCurrentMove({ r, c, len: myDiceNumber });
        } else {
            setCurrentMove({ r: 0, c: 0, len: -1 });
        }
    };

    const clickOnCell = (r: number, c: number) => {
        if (isAValidMove[r][c]) {
            //optimistic UI update
            const move: Move = { r, c, len: myDiceNumber };
            const moveAction: DiceTerritoryAction = {
                type: "MOVE",
                userId: user.id,
                move,
            };
            setMatch((prev) => {
                const { newState, isValid, error } = engine.processAction(
                    prev,
                    moveAction,
                );
                if (isValid) {
                    return newState;
                }
                console.error(error);
                return prev;
            });
            socket.emit(
                "match:action",
                {
                    matchId: match.id,
                    action: moveAction,
                },
                ({ ok, error }: { ok: boolean; error?: string }) => {
                    if (!ok) {
                        console.error(error);
                    }
                },
            );
        }
        setCurrentMove({ r: 0, c: 0, len: -1 });
    };

    return (
        <div
            className="w-100 h-100 gap-px bg-black border"
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${W}, 1fr)`,
                gridTemplateRows: `repeat(${H}, 1fr)`,
            }}
        >
            {Array.from({ length: W * H }, (_, i) => {
                const r = H - Math.floor(i / W);
                const c = (i % W) + 1;
                const isYours = board[r][c] == 1;
                const isEnemys = board[r][c] == 2;
                const inCurrentMoveSquare =
                    currentMove.r <= r &&
                    r <= currentMove.r + currentMove.len - 1 &&
                    currentMove.c <= c &&
                    c <= currentMove.c + currentMove.len - 1;
                return (
                    <div
                        key={`cell-${r}-${c}`}
                        onMouseOver={() => hoverOnCell(r, c)}
                        onClick={() => clickOnCell(r, c)}
                        style={{
                            backgroundColor: inCurrentMoveSquare
                                ? "grey"
                                : isYours
                                  ? "blue"
                                  : isEnemys
                                    ? "red"
                                    : "white",
                        }}
                    ></div>
                );
            })}
        </div>
    );
}
