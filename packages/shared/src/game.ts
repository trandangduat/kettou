export interface GameMove {
    r: number;
    c: number;
    len: number;
}

export interface PlayerState {
    id: number;
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
    player1: PlayerState | null;
    player2: PlayerState | null;
    roundNumber: number;
    rounds: GameRound[];
    turn: number | null;
    waitingQueues: PlayerState[];
    endState: EndGameState | null;
}

export const createInitGameState = (): GameState => ({
    status: "WAITING",
    player1: null,
    player2: null,
    roundNumber: 0,
    rounds: [],
    turn: null,
    waitingQueues: [],
    endState: null,
});
