import { Room } from "shared";

export interface GameStateDict {
    [key: string]: Room;
}

export const gameStates: GameStateDict = {};
