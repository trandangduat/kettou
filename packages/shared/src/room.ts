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

export const initRoom = (): Room => ({
    status: "WAITING",
    players: [],
    roundNumber: 0,
    rounds: [],
    turn: 0,
    waitingQueues: [],
    endState: null,
});
