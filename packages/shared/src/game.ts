export interface GameMove {
    r: number;
    c: number;
    d: number;
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

export interface GameState {
    player1: PlayerState | null;
    player2: PlayerState | null;
    roundNumber: number;
    rounds: GameRound[];
    waitingQueues: PlayerState[];
    canStart: boolean;
    isPlaying: boolean;
    turn: number | null;
}

export const createInitGameState = (): GameState => ({
    player1: null,
    player2: null,
    roundNumber: 0,
    rounds: [],
    waitingQueues: [],
    canStart: false,
    isPlaying: false,
    turn: null,
});
