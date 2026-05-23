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
export interface EndGameState {
    playerPoints: Record<string, number>;
}
export interface GameState {
    player1: PlayerState | null;
    player2: PlayerState | null;
    roundNumber: number;
    rounds: GameRound[];
    turn: number | null;
    waitingQueues: PlayerState[];
    canStart: boolean;
    isPlaying: boolean;
    ended: boolean;
    endState: EndGameState | null;
}
export declare const createInitGameState: () => GameState;
//# sourceMappingURL=game.d.ts.map