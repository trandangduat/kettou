export interface Player {
    userId: string;
    username: string;
    elo: number;
}

export type MatchStatus = "WAITING" | "READY" | "PLAYING" | "ENDED";
export type MatchType = "CUSTOM" | "RANKED";

export interface Match<TGameState> {
    id: string;
    gameId: string;
    type: MatchType;
    status: MatchStatus;
    players: Player[];
    gameState: TGameState;
}

export interface ActionResult<TGameState> {
    newState: TGameState;
    isValid: boolean;
    error?: string;
}

export interface IGameEngine<TGameState, TAction> {
    createNewMatchState(matchType: MatchType): Match<TGameState>;
    processAction(
        state: Match<TGameState>,
        action: TAction,
    ): ActionResult<Match<TGameState>>;
}
