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
export type RoomStatus = "WAITING" | "READY" | "PLAYING" | "ENDED";
export interface Room {
    status: RoomStatus;
    players: Player[];
    roundNumber: number;
    rounds: GameRound[];
    turn: number;
    waitingQueues: Player[];
    endState: EndGameState | null;
}
export declare const initRoom: () => Room;
//# sourceMappingURL=game.d.ts.map