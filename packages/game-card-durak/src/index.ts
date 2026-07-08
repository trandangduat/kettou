import {
    ActionResult,
    IGameEngine,
    Match,
    MatchType,
    newMatch,
} from "@mini-games/core";
import { DurakState } from "./types.js";
import { createOrderedDeck } from "./utils.js";

export const gameDefinition = {
    id: "card-durak",
    createEngine: () => new DurakEngine(),
};

export type MatchState = Match<DurakState>;
export type DurakAction = { type: "START_MATCH"; userId: string };

const startMatch = (state: MatchState, userId: string): MatchState => {
    return state;
};

export class DurakEngine implements IGameEngine<DurakState, DurakAction> {
    createNewMatchState(matchType: MatchType): MatchState {
        return {
            ...newMatch(gameDefinition.id, matchType),
            gameState: {
                drawPile: createOrderedDeck(),
                discardPile: [],
                playerHands: {},
                tablePairs: [],
            },
        };
    }

    processAction(
        state: MatchState,
        action: DurakAction,
    ): ActionResult<MatchState> {
        try {
            let newState: MatchState = state;
            switch (action.type) {
                case "START_MATCH": {
                    const { userId } = action;
                    newState = startMatch(state, userId);
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

export * from "./types.js";
export * from "./utils.js";
