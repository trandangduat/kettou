export interface Player {
    socketId: string;
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

export interface IGameEngine<TGameState, TAction, TGameStateClient> {
    createNewMatchState(matchType: MatchType): Match<TGameState>;
    processAction(
        state: Match<TGameState>,
        action: TAction,
    ): ActionResult<Match<TGameState>>;
    convertToClientMatchState(
        match: Match<TGameState>,
        userId: string,
    ): Match<TGameStateClient>;
}

export const NOT_A_PLAYER_MSG =
    "You must be a player of this match to perform such actions.";
export const NOT_YOUR_TURN_MSG = "It is not your turn.";
export const GAME_NOT_STARTED_MSG = "Game has not started yet.";
export const NOT_HOST_MSG = "You must be the host to perform such actions.";
export const MATCH_NOT_READY_MSG = "Match is not ready yet.";
export const INVALID_ACTION_MSG = "Invalid action.";
