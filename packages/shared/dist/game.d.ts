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
export declare const createInitGameState: () => GameState;
//# sourceMappingURL=game.d.ts.map