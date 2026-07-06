import { DiceTerritoryState, Move, Round } from "./types.js";
import {
    ActionResult,
    GameRegistry,
    IGameEngine,
    Match,
    MatchType,
    newMatch,
} from "@mini-games/core";
import {
    addMove,
    endMatch,
    getRandomNumber,
    moveOnToNextRound,
} from "./utils.js";

const NOT_A_PLAYER_MSG =
    "You must be a player of this match to perform such actions.";
const INVALID_MOVE_MSG = "Invalid move. Move again";
const NOT_YOUR_TURN_MSG = "It is not your turn.";
const GAME_NOT_STARTED_MSG = "Game has not started yet.";
const NOT_HOST_MSG = "You must be the host to perform such actions.";

export type MatchState = Match<DiceTerritoryState>;

type DiceTerritoryAction =
    | { type: "START_MATCH"; userId: string }
    | { type: "ROLL_DICE"; userId: string }
    | { type: "MOVE"; userId: string; move: Move }
    | { type: "SKIP_TURN"; userId: string };

const startMatch = (state: MatchState, userId: string): MatchState => {
    const { players, status, gameState } = state;

    let isPlayer = players.some((p) => p.userId === userId);
    let isHost = players[0].userId === userId;
    let isReady = status === "READY";
    if (!isPlayer) {
        throw new Error(NOT_A_PLAYER_MSG);
    }
    if (!isHost) {
        throw new Error(NOT_HOST_MSG);
    }
    if (!isReady) {
        throw new Error("Match is not ready yet.");
    }

    let firstTurn = getRandomNumber(players.length);
    return {
        ...state,
        status: "PLAYING",
        gameState: {
            ...gameState,
            roundNumber: 1,
            turn: firstTurn,
        },
    };
};

const rollDice = (state: MatchState, userId: string): MatchState => {
    const { gameState, players, status } = state;
    const { rounds, turn } = gameState;

    let isPlayer = players.some((p) => p.userId === userId);
    let isPlaying = status === "PLAYING";
    let isPlayerTurn = players[turn].userId === userId;
    if (!isPlayer) {
        throw new Error(NOT_A_PLAYER_MSG);
    }
    if (!isPlaying) {
        throw new Error(GAME_NOT_STARTED_MSG);
    }
    if (!isPlayerTurn) {
        throw new Error(NOT_YOUR_TURN_MSG);
    }

    const newDiceNumber = getRandomNumber(6) + 1;
    const newRound: Round = {
        move: null,
        diceNumber: newDiceNumber,
        playerId: userId,
    };
    return {
        ...state,
        gameState: {
            ...gameState,
            rounds: [...rounds, newRound],
        },
    };
};

const submitMove = (
    state: MatchState,
    userId: string,
    move: Move,
): MatchState => {
    const { players, gameState, status } = state;
    const { turn } = gameState;

    let isPlayer = players.some((p) => p.userId === userId);
    let isPlaying = status === "PLAYING";
    let isPlayerTurn = players[turn].userId === userId;
    if (!isPlayer) {
        throw new Error(NOT_A_PLAYER_MSG);
    }
    if (!isPlaying) {
        throw new Error(GAME_NOT_STARTED_MSG);
    }
    if (!isPlayerTurn) {
        throw new Error(NOT_YOUR_TURN_MSG);
    }

    // need move validation here

    let newMatchState = moveOnToNextRound(addMove(state, move));
    return newMatchState;
};

const skipTurn = (state: MatchState, userId: string): MatchState => {
    const { players, gameState, status } = state;
    const { turn, roundNumber, rounds } = gameState;

    let isPlayer = players.some((p) => p.userId === userId);
    let isPlaying = status === "PLAYING";
    let isPlayerTurn = players[turn].userId === userId;
    if (!isPlayer) {
        throw new Error(NOT_A_PLAYER_MSG);
    }
    if (!isPlaying) {
        throw new Error(GAME_NOT_STARTED_MSG);
    }
    if (!isPlayerTurn) {
        throw new Error(NOT_YOUR_TURN_MSG);
    }

    let newMatchState = { ...state };
    let prevPlayerSkipMove = roundNumber >= 2 && !rounds[roundNumber - 2].move;

    if (prevPlayerSkipMove) {
        newMatchState = endMatch(newMatchState);
    } else {
        newMatchState = moveOnToNextRound(newMatchState);
    }
    return newMatchState;
};

export class DiceTerritoryEngine implements IGameEngine<
    DiceTerritoryState,
    DiceTerritoryAction
> {
    createNewMatchState(matchType: MatchType): Match<DiceTerritoryState> {
        return {
            ...newMatch(gameId, matchType),
            gameState: {
                roundNumber: 0,
                rounds: [],
                turn: 0,
                endState: null,
            },
        };
    }

    processAction(
        state: MatchState,
        action: DiceTerritoryAction,
    ): ActionResult<MatchState> {
        try {
            let newState: MatchState = state;
            switch (action.type) {
                case "START_MATCH": {
                    const { userId } = action;
                    newState = startMatch(state, userId);
                    break;
                }
                case "ROLL_DICE": {
                    const { userId } = action;
                    newState = rollDice(state, userId);
                    break;
                }
                case "MOVE": {
                    const { move, userId } = action;
                    newState = submitMove(state, userId, move);
                    break;
                }
                case "SKIP_TURN": {
                    const { userId } = action;
                    newState = skipTurn(state, userId);
                    break;
                }
            }
            return {
                newState,
                isValid: true,
            };
        } catch (error) {
            return {
                newState: null,
                isValid: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}

export const gameId = "dice-territory";
export const createEngine = () => new DiceTerritoryEngine();
export * from "./types.js";
export * from "./logic.js";
