import { GameState } from "shared";

export interface GameStateDict {
    [key: string]: GameState;
}

export const gameStates: GameStateDict = {};
