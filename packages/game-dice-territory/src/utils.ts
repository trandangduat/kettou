import { MatchState } from "./index.js";
import { Move } from "./types.js";

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
    const { gameState } = matchState;
    const { rounds } = gameState;

    let playerPoints: Record<string, number> = {};
    let highestScore = 0;

    for (let { playerId: pid, move } of rounds) {
        if (!move) continue;
        playerPoints[pid] ??= 0;
        playerPoints[pid] += move.len * move.len;
        highestScore = Math.max(highestScore, playerPoints[pid]);
    }

    let winners = Object.entries(playerPoints).filter(
        ([_, score]) => score == highestScore,
    );

    return {
        ...matchState,
        status: "ENDED",
        gameState: {
            ...gameState,
            endState: {
                winnerUserId: winners.length >= 2 ? null : winners[0][0],
                playerPoints: playerPoints,
            },
        },
    };
};
