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

export interface EndGameState {
    winnerUserId: string | null;
    playerPoints: Record<string, number>;
}

export interface DiceTerritoryState {
    roundNumber: number;
    rounds: Round[];
    turn: number;
    endState: EndGameState | null;
}
