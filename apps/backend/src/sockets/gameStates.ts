export interface GameMove {
    r: Number;
    c: Number;
    d: Number;
}

export interface PlayerState {
    username: String;
    id: String;
    moves: GameMove[];
}

export interface GameState {
    player1: PlayerState | null;
    player2: PlayerState | null;
    canStart: Boolean;
    isPlaying: Boolean;
    turn: String;
}

export interface GameStateDict {
    [key: string]: GameState;
}

export const gameStates: GameStateDict = {};
