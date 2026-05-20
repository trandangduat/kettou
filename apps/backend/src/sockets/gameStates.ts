import { GameState } from "shared";

export interface GameStateDict {
    [key: string]: GameState;
}

export const gameStates: GameStateDict = {};

export const createInitGameState = (): GameState => ({
    player1: null,
    player2: null,
    waitingQueues: [],
    canStart: false,
    isPlaying: false,
    turn: null,
});
