import type { GameMove, GameState } from "shared";
import { Route } from "..";
import { useState } from "react";
import { socket } from "#/socket";

interface GameBoardProps {
    gameState?: GameState;
    myTurn: boolean;
    myDiceNumber: number;
}

const generatePrefixSum = ({
    W,
    H,
    board,
}: {
    W: number;
    H: number;
    board: number[][];
}): number[][] => {
    const f: number[][] = Array.from({ length: H + 2 }, () =>
        Array(W + 2).fill(0),
    );
    for (let i = 0; i <= H + 1; i++) {
        for (let j = 0; j <= W + 1; j++) {
            f[i][j] += i > 0 ? f[i - 1][j] : 0;
            f[i][j] += j > 0 ? f[i][j - 1] : 0;
            f[i][j] -= i > 0 && j > 0 ? f[i - 1][j - 1] : 0;
            f[i][j] += board[i][j];
        }
    }
    return f;
};

const getSumInRect = ({
    W,
    H,
    sum,
    sr,
    sc,
    dr,
    dc,
}: {
    W: number;
    H: number;
    sum: number[][];
    sr: number;
    sc: number;
    dr: number;
    dc: number;
}): number => {
    let res = sum[dr][dc];
    res -= sr > 0 ? sum[sr - 1][dc] : 0;
    res -= sc > 0 ? sum[dr][sc - 1] : 0;
    res += sr > 0 && sc > 0 ? sum[sr - 1][sc - 1] : 0;
    return res;
};

const checkValidMove = ({
    W,
    H,
    r,
    c,
    d,
    sumBoard,
    sumBoardMine,
}: {
    W: number;
    H: number;
    r: number;
    c: number;
    d: number;
    sumBoard: number[][];
    sumBoardMine: number[][];
}): boolean => {
    // check square in board
    if (r + d - 1 > H || c + d - 1 > W) return false;

    // check overlap
    if (
        getSumInRect({
            H,
            W,
            sr: r,
            sc: c,
            dr: r + d - 1,
            dc: c + d - 1,
            sum: sumBoard,
        }) > 0
    )
        return false;

    // check adjacent edge with other squares (only check with own squares)
    // check edge from L-T-R-B
    if (
        getSumInRect({
            H,
            W,
            sr: r,
            sc: c - 1,
            dr: r + d - 1,
            dc: c - 1,
            sum: sumBoardMine,
        }) === 0 &&
        getSumInRect({
            H,
            W,
            sr: r - 1,
            sc: c,
            dr: r - 1,
            dc: c + d - 1,
            sum: sumBoardMine,
        }) === 0 &&
        getSumInRect({
            H,
            W,
            sr: r,
            sc: c + d,
            dr: r + d - 1,
            dc: c + d,
            sum: sumBoardMine,
        }) === 0 &&
        getSumInRect({
            H,
            W,
            sr: r + d,
            sc: c,
            dr: r + d,
            dc: c + d - 1,
            sum: sumBoardMine,
        }) === 0
    )
        return false;
    return true;
};

export function GameBoard({ gameState, myTurn, myDiceNumber }: GameBoardProps) {
    const room = Route.useLoaderData();
    const { user } = Route.useRouteContext();
    const W = 10;
    const H = 10;
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
    const [currentMove, setCurrentMove] = useState<GameMove>({
        r: 0,
        c: 0,
        d: -1,
    });
    let moves: Record<string, (GameMove | null)[]> = {
        yours: [],
        enemys: [],
    };

    if (gameState?.rounds) {
        moves = {
            yours: gameState?.rounds
                .filter((round) => round.playerId === user.userId)
                .map((round) => round.move),
            enemys: gameState?.rounds
                .filter((round) => round.playerId !== user.userId)
                .map((round) => round.move),
        };
        // putting the square in the bottom edge of the board is always valid
        for (let j = 1; j <= W; j++) board[0][j] = 1;

        for (const move of moves?.yours) {
            if (!move) continue;
            let { r, c, d: len } = move;
            for (let i = r; i <= r + len - 1; i++) {
                for (let j = c; j <= c + len - 1; j++) {
                    board[i][j] = 1;
                }
            }
        }
        sumBoardMine = generatePrefixSum({ W, H, board });
        for (const move of moves?.enemys) {
            if (!move) continue;
            let { r, c, d: len } = move;
            r = H - r + 1;
            c = W - c + 1;
            for (let i = r; i >= r - len + 1; i--) {
                for (let j = c; j >= c - len + 1; j--) {
                    board[i][j] = 2;
                }
            }
        }
        sumBoard = generatePrefixSum({ W, H, board });
    }

    if (gameState?.isPlaying && myTurn && myDiceNumber > 0) {
        let countValid = 0;
        for (let r = 1; r <= H; r++) {
            for (let c = 1; c <= W; c++) {
                isAValidMove[r][c] = checkValidMove({
                    W,
                    H,
                    r,
                    c,
                    d: myDiceNumber,
                    sumBoard,
                    sumBoardMine,
                });
                countValid += isAValidMove[r][c] ? 1 : 0;
            }
        }
        if (countValid === 0) {
            socket.emit("cannot move", {
                roomId: room.id,
                userId: user.userId,
            });
        }
    }

    const hoverOnCell = (r: number, c: number) => {
        if (isAValidMove[r][c]) {
            setCurrentMove({ r, c, d: myDiceNumber });
        } else {
            setCurrentMove({ r: 0, c: 0, d: -1 });
        }
    };

    const clickOnCell = (r: number, c: number) => {
        if (isAValidMove[r][c]) {
            socket.emit("finish move", {
                roomId: room.id,
                userId: user.userId,
                move: {
                    r,
                    c,
                    d: myDiceNumber,
                },
            });
        }
        setCurrentMove({ r: 0, c: 0, d: -1 });
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
                    r <= currentMove.r + currentMove.d - 1 &&
                    currentMove.c <= c &&
                    c <= currentMove.c + currentMove.d - 1;
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
