import { DiceTerritoryAction, DiceTerritoryState, DiceTerritoryStateClient, MatchState, MatchStateClient, Move, Round } from "./types.js";
import {
    ActionResult,
    GAME_NOT_STARTED_MSG,
    IGameEngine,
    INVALID_ACTION_MSG,
    Match,
    MatchType,
    newMatch,
    NOT_A_PLAYER_MSG,
    NOT_YOUR_TURN_MSG,
} from "@mini-games/core";
import {
    addMove,
    endMatch,
    getRandomNumber,
    moveOnToNextRound,
    validateMove,
} from "./utils.js";

export const gameDefinition = {
    id: "dice-territory",
    createEngine: () => new DiceTerritoryEngine(),
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

    if (!validateMove(state, userId, move)) {
        throw new Error(INVALID_ACTION_MSG);
    }

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
    DiceTerritoryAction,
    DiceTerritoryStateClient
> {
    createNewMatchState(matchType: MatchType): Match<DiceTerritoryState> {
        return {
            ...newMatch(gameDefinition.id, matchType),
            gameState: {
                roundNumber: 0,
                rounds: [],
                turn: 0,
            },
        };
    }

    getInitialMatchState(state: MatchState): MatchState {
        const { players, gameState } = state;
        let firstTurn = getRandomNumber(players.length);
        return {
            ...state,
            gameState: {
                ...gameState,
                roundNumber: 1,
                turn: firstTurn,
            },
        };
    };

    processAction(
        state: MatchState,
        action: DiceTerritoryAction,
    ): ActionResult<MatchState> {
        try {
            let newState: MatchState = state;
            switch (action.type) {
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

    convertToClientMatchState(
        match: Match<DiceTerritoryState>,
        userId: string,
    ): MatchStateClient {
        return match;
    }
}

export * from "./types.js";
export * from "./logic.js";
export * from "./utils.js";
