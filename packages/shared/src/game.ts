export interface GameMove {
    r: number;
    c: number;
    len: number;
}

export interface Player {
    userId: number;
    username: string;
}

export interface GameRound {
    move: GameMove | null;
    diceNumber: number;
    playerId: number;
}

export interface EndGameState {
    playerPoints: Record<string, number>;
}

export type GameStatus = "WAITING" | "READY" | "PLAYING" | "ENDED";

export interface GameState {
    status: GameStatus;
    players: Player[];
    roundNumber: number;
    rounds: GameRound[];
    turn: number;
    waitingQueues: Player[];
    endState: EndGameState | null;
}

export const createInitGameState = (): GameState => ({
    status: "WAITING",
    players: [],
    roundNumber: 0,
    rounds: [],
    turn: 0,
    waitingQueues: [],
    endState: null,
});
