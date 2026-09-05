import { CommonEndReason, EndState, Match } from "@mini-games/core";

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

export interface DiceTerritoryState {
    roundNumber: number;
    rounds: Round[];
    turn: number;
}

export interface DiceTerritoryStateClient {
    roundNumber: number;
    rounds: Round[];
    turn: number;
}

export type MatchState = Match<DiceTerritoryState>;
export type MatchStateClient = Match<DiceTerritoryStateClient>;
export type DiceTerritoryEndReason = CommonEndReason | "BOTH_IMMOVABLE";
export type DiceTerritoryEndState = EndState<DiceTerritoryEndReason>;
export type DiceTerritoryAction =
    | { type: "ROLL_DICE"; userId: string }
    | { type: "MOVE"; userId: string; move: Move }
    | { type: "SKIP_TURN"; userId: string };
