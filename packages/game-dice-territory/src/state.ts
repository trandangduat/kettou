import { MatchState, } from "./index.js";
import { DiceTerritoryEndState, Move } from "./types.js";

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

export const skipTurn = (state: MatchState): MatchState => {
    const { gameState } = state;
    const { roundNumber, rounds } = gameState;

    let newMatchState = { ...state };
    let prevPlayerSkipMove = roundNumber >= 2 && !rounds[roundNumber - 2].move;

    if (prevPlayerSkipMove) {
        newMatchState = endMatch(newMatchState);
    } else {
        newMatchState = moveOnToNextRound(newMatchState);
    }
    return newMatchState;
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
