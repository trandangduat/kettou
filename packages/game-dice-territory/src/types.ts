import { Match } from "@mini-games/core";

export interface Move {
    r: number;
    c: number;
    len: number;
}

export interface Round {
    move: Move | null;
    diceNumber: number;
    playerId: string;
}

export interface EndGameState {
    winnerUserId: string | null;
    playerPoints: Record<string, number>;
}

export interface DiceTerritoryState {
    roundNumber: number;
    rounds: Round[];
    turn: number;
    endState: EndGameState | null;
}

export interface DiceTerritoryStateClient {
    roundNumber: number;
    rounds: Round[];
    turn: number;
    endState: EndGameState | null;
}

export type MatchState = Match<DiceTerritoryState>;
export type MatchStateClient = Match<DiceTerritoryStateClient>;
export type DiceTerritoryAction =
    | { type: "START_MATCH"; userId: string }
    | { type: "ROLL_DICE"; userId: string }
    | { type: "MOVE"; userId: string; move: Move }
    | { type: "SKIP_TURN"; userId: string };
