import { MatchState, Move } from "./types.js";
import {
    createPrefixSumMatrix,
    getRectangleSum,
    PrefixSumMatrix,
} from "./utils.js";

export type IsValidSquareMoveParams = {
    boardWidth: number;
    boardHeight: number;
    row: number;
    col: number;
    squareSize: number;
    occupiedCellsPrefixSum: PrefixSumMatrix;
    ownCellsPrefixSum: PrefixSumMatrix;
};

export const isValidSquareMove = ({
    boardWidth,
    boardHeight,
    row,
    col,
    squareSize,
    occupiedCellsPrefixSum,
    ownCellsPrefixSum,
}: IsValidSquareMoveParams): boolean => {
    // The square must fit inside the playable board.
    if (row + squareSize - 1 > boardHeight || col + squareSize - 1 > boardWidth)
        return false;

    // The square cannot overlap any occupied cell.
    if (
        getRectangleSum({
            topRow: row,
            leftCol: col,
            bottomRow: row + squareSize - 1,
            rightCol: col + squareSize - 1,
            prefixSumMatrix: occupiedCellsPrefixSum,
        }) > 0
    )
        return false;

    // The square must touch one of the player's existing edges.
    return (
        getRectangleSum({
            topRow: row,
            leftCol: col - 1,
            bottomRow: row + squareSize - 1,
            rightCol: col - 1,
            prefixSumMatrix: ownCellsPrefixSum,
        }) > 0 ||
        getRectangleSum({
            topRow: row - 1,
            leftCol: col,
            bottomRow: row - 1,
            rightCol: col + squareSize - 1,
            prefixSumMatrix: ownCellsPrefixSum,
        }) > 0 ||
        getRectangleSum({
            topRow: row,
            leftCol: col + squareSize,
            bottomRow: row + squareSize - 1,
            rightCol: col + squareSize,
            prefixSumMatrix: ownCellsPrefixSum,
        }) > 0 ||
        getRectangleSum({
            topRow: row + squareSize,
            leftCol: col,
            bottomRow: row + squareSize,
            rightCol: col + squareSize - 1,
            prefixSumMatrix: ownCellsPrefixSum,
        }) > 0
    );
};

// calculate essential game boards in playerId's perspective after rolling the dice
export const calculateBoards = (
    W: number,
    H: number,
    state: MatchState,
    playerId: string,
    diceNumber: number,
) => {
    const { rounds } = state.gameState;

    const board: number[][] = Array.from({ length: H + 2 }, () =>
        Array(W + 2).fill(0),
    );
    let sumBoard: number[][] = Array.from({ length: H + 2 }, () =>
        Array(W + 2).fill(0),
    );
    let sumBoardMine: number[][] = Array.from({ length: H + 2 }, () =>
        Array(W + 2).fill(0),
    );
    const isAValidMove: boolean[][] = Array.from({ length: H + 2 }, () =>
        Array(W + 2).fill(false),
    );
    let moves: Record<string, (Move | null)[]> = {
        yours: [],
        enemys: [],
    };

    moves = {
        mine: rounds
            .filter((round) => round.playerId === playerId)
            .map((round) => round.move),
        enemys: rounds
            .filter((round) => round.playerId !== playerId)
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

    let countValidMoves = 0;
    for (let r = 1; r <= H; r++) {
        for (let c = 1; c <= W; c++) {
            isAValidMove[r][c] = isValidSquareMove({
                boardWidth: W,
                boardHeight: H,
                row: r,
                col: c,
                squareSize: diceNumber,
                occupiedCellsPrefixSum: sumBoard,
                ownCellsPrefixSum: sumBoardMine,
            });
            countValidMoves += isAValidMove[r][c] ? 1 : 0;
        }
    }

    return {
        board,
        isAValidMove,
        countValidMoves,
    };
};

export const validateMove = (
    match: MatchState,
    playerId: string,
    move: Move,
): boolean => {
    const { isAValidMove } = calculateBoards(8, 8, match, playerId, move.len);
    return isAValidMove[move.r]?.[move.c] ?? false;
};
