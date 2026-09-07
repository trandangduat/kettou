import {
    DiceTerritoryAction,
    DiceTerritoryState,
    DiceTerritoryStateClient,
    MatchState,
    MatchStateClient,
    Move,
    Round,
} from "./types.js";
import {
    ActionResult,
    EndState,
    GAME_NOT_STARTED_MSG,
    IGameEngine,
    INVALID_ACTION_MSG,
    Match,
    MatchStatus,
    MatchType,
    newMatch,
    NOT_A_PLAYER_MSG,
    NOT_YOUR_TURN_MSG,
    Player,
    updatePlayerStatus,
} from "@mini-games/core";
import {
    addMove,
    getRandomNumber,
    moveOnToNextRound,
    skipTurn,
    validateMove,
} from "./utils.js";
import { calculateBoards } from "./logic.js";

export const gameDefinition = {
    id: "dice-territory",
    createEngine: () => new DiceTerritoryEngine(),
};

const rollDice = (state: MatchState, userId: string): any => {
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
    const prevRound = rounds[rounds.length - 1];
    if (prevRound) {
        if (prevRound.playerId === userId && !prevRound.move) {
            throw new Error("You have already rolled the dice.");
        }
    }

    const newDiceNumber = getRandomNumber(6) + 1;
    const newRound: Round = {
        move: null,
        diceNumber: newDiceNumber,
        playerId: userId,
    };
    let newState = {
        ...state,
        gameState: {
            ...gameState,
            rounds: [...rounds, newRound],
        },
    };
    const { countValidMoves } = calculateBoards(
        8,
        8,
        newState,
        userId,
        newDiceNumber,
    );
    if (countValidMoves === 0) {
        newState = skipTurn(newState);
    }

    return {
        updatedState: newState,
        diceNumber: newDiceNumber,
        turnedSkipped: countValidMoves === 0,
        msg:
            countValidMoves === 0
                ? "Skip turn because no valid moves"
                : "Dice rolled successfully",
    };
};

const submitMove = (
    state: MatchState,
    userId: string,
    move: Move,
): MatchState => {
    const { players, gameState, status } = state;
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
    const prevRound = rounds[rounds.length - 1];
    if (prevRound) {
        if (
            prevRound.playerId === userId &&
            prevRound.diceNumber !== move.len
        ) {
            throw new Error("Square length does not match your dice number.");
        }
    }

    if (!validateMove(state, userId, move)) {
        throw new Error(INVALID_ACTION_MSG);
    }

    let newMatchState = moveOnToNextRound(addMove(state, move));
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
    }

    processAction(
        state: MatchState,
        action: DiceTerritoryAction,
    ): ActionResult<MatchState> {
        try {
            let newState: MatchState = state;
            let data: any;
            switch (action.type) {
                case "ROLL_DICE": {
                    const { userId } = action;
                    const { updatedState, diceNumber, turnedSkipped, msg } =
                        rollDice(state, userId);
                    newState = updatedState;
                    data = { diceNumber, turnedSkipped, msg };
                    break;
                }
                case "MOVE": {
                    const { move, userId } = action;
                    newState = submitMove(state, userId, move);
                    break;
                }
            }
            return {
                newState,
                isValid: true,
                data,
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
