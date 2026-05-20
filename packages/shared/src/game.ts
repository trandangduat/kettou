export interface GameMove {
    r: number;
    c: number;
    d: number;
}

export interface PlayerState {
    id: number;
    username: string;
    moves: GameMove[];
}

export interface GameState {
    player1: PlayerState | null;
    player2: PlayerState | null;
    waitingQueues: PlayerState[];
    canStart: boolean;
    isPlaying: boolean;
    turn: number | null;
}
