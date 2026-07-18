import {
    createPrefixSumMatrix,
    isValidSquareMove,
    MatchState,
} from "./index.js";
import { DiceTerritoryEndState, Move } from "./types.js";

/* return random integer from 0 to upperBound - 1
 */
export const getRandomNumber = (upperBound: number): number => {
    return Math.floor(Math.random() * upperBound);
};

export const addMove = (state: MatchState, move: Move): MatchState => {
    const { gameState } = state;
    const { roundNumber, rounds } = gameState;
    const newRounds = [...rounds];
    if (!newRounds[roundNumber - 1].move) {
        newRounds[roundNumber - 1].move = move;
    }
    return { ...state, gameState: { ...gameState, rounds: newRounds } };
};

export const moveOnToNextRound = (state: MatchState): MatchState => {
    const { players, gameState } = state;
    const { roundNumber, turn } = gameState;
    let totalPlayers = players.length;
    let newGameState = { ...gameState };
    if (roundNumber > 0) {
        let nextTurn = (turn + 1) % totalPlayers;
        newGameState = {
            ...newGameState,
            roundNumber: roundNumber + 1,
            turn: nextTurn,
        };
    }
    return { ...state, gameState: newGameState };
};

export const endMatch = (matchState: MatchState): MatchState => {
    const { gameState, players } = matchState;
    const { rounds } = gameState;

    let playerPoints: Record<string, number> = {};
    let highestScore = 0;

    for (let { userId } of players) {
        playerPoints[userId] = 0;
    }

    for (let { playerId: pid, move } of rounds) {
        if (!move) continue;
        playerPoints[pid] += move.len * move.len;
        highestScore = Math.max(highestScore, playerPoints[pid]);
    }

    let winners = Object.entries(playerPoints).filter(
        ([_, score]) => score == highestScore,
    );

    let endState: DiceTerritoryEndState = {
        reason: "BOTH_IMMOVABLE",
        winnerId: winners.length >= 2 ? null : winners[0][0],
        scores: playerPoints,
    };

    return {
        ...matchState,
        status: "ENDED",
        endState,
    };
};

export const validateMove = (
    match: MatchState,
    playerId: string,
    move: Move,
): boolean => {
    const { gameState } = match;
    const { rounds } = gameState;

    const W = 8;
    const H = 8;
    const board: number[][] = Array.from({ length: H + 2 }, () =>
        Array(W + 2).fill(0),
    );
    let sumBoard: number[][] = Array.from({ length: H + 2 }, () =>
        Array(W + 2).fill(0),
    );
    let sumBoardMine: number[][] = Array.from({ length: H + 2 }, () =>
        Array(W + 2).fill(0),
    );

    let moves: Record<string, (Move | null)[]> = {
        yours: [],
        enemys: [],
    };

    if (rounds) {
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
    }

    const { r, c, len: myDiceNumber } = move;

    return isValidSquareMove({
        boardWidth: W,
        boardHeight: H,
        row: r,
        col: c,
        squareSize: myDiceNumber,
        occupiedCellsPrefixSum: sumBoard,
        ownCellsPrefixSum: sumBoardMine,
    });
};
