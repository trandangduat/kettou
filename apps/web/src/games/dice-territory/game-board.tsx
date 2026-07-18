import { useState, type Dispatch, type SetStateAction } from "react";
import { socket } from "#/socket";
import {
    createPrefixSumMatrix,
    DiceTerritoryEngine,
    isValidSquareMove,
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
    myTurn,
    myDiceNumber,
    engine,
    setMatch,
}: GameBoardProps) {
    const { status, gameState } = match;
    const { rounds } = gameState;
    const W = 8;
    const H = 8;
    const board: number[][] = Array.from({ length: H + 2 }, () =>
        Array(W + 2).fill(0),
    );
    const isAValidMove: boolean[][] = Array.from({ length: H + 2 }, () =>
        Array(W + 2).fill(false),
    );
    let sumBoard: number[][] = Array.from({ length: H + 2 }, () =>
        Array(W + 2).fill(0),
    );
    let sumBoardMine: number[][] = Array.from({ length: H + 2 }, () =>
        Array(W + 2).fill(0),
    );
    const [currentMove, setCurrentMove] = useState<Move>({
        r: 0,
        c: 0,
        len: -1,
    });
    let moves: Record<string, (Move | null)[]> = {
        yours: [],
        enemys: [],
    };

    if (rounds) {
        moves = {
            mine: rounds
                .filter((round) => round.playerId === user.id)
                .map((round) => round.move),
            enemys: rounds
                .filter((round) => round.playerId !== user.id)
                .map((round) => round.move),
        };
        // putting the square in the bottom edge of the board is always valid
        for (let j = 1; j <= W; j++) board[0][j] = 1;

        for (const move of moves?.mine) {
            if (!move) continue;
            let { r, c, len: len } = move;
            for (let i = r; i <= r + len - 1; i++) {
                for (let j = c; j <= c + len - 1; j++) {
                    board[i][j] = 1;
                }
            }
        }
        sumBoardMine = createPrefixSumMatrix({
            boardWidth: W,
            boardHeight: H,
            sourceMatrix: board,
        });
        for (const move of moves?.enemys) {
            if (!move) continue;
            let { r, c, len } = move;
            r = H - r + 1;
            c = W - c + 1;
            for (let i = r; i >= r - len + 1; i--) {
                for (let j = c; j >= c - len + 1; j--) {
                    board[i][j] = 2;
                }
            }
        }
        sumBoard = createPrefixSumMatrix({
            boardWidth: W,
            boardHeight: H,
            sourceMatrix: board,
        });
    }

    if (status === "PLAYING" && myTurn && myDiceNumber > 0) {
        let countValid = 0;
        for (let r = 1; r <= H; r++) {
            for (let c = 1; c <= W; c++) {
                isAValidMove[r][c] = isValidSquareMove({
                    boardWidth: W,
                    boardHeight: H,
                    row: r,
                    col: c,
                    squareSize: myDiceNumber,
                    occupiedCellsPrefixSum: sumBoard,
                    ownCellsPrefixSum: sumBoardMine,
                });
                countValid += isAValidMove[r][c] ? 1 : 0;
            }
        }
        if (countValid === 0) {
            socket.emit(
                "match:action",
                {
                    matchId: match.id,
                    action: {
                        type: "SKIP_TURN",
                        userId: user.id,
                    },
                },
                ({ ok, error }: { ok: boolean; error?: string }) => {
                    if (!ok) {
                        console.error(error);
                    }
                },
            );
        }
    }

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
