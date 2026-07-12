import {
    ActionResult,
    GAME_NOT_STARTED_MSG,
    IGameEngine,
    INVALID_ACTION_MSG,
    Match,
    MatchType,
    newMatch,
    NOT_A_PLAYER_MSG,
    NOT_HOST_MSG,
    NOT_YOUR_TURN_MSG,
} from "@mini-games/core";
import {
    Card,
    DurakAction,
    DurakState,
    EndGameState,
    MatchState,
    DurakStateClient,
    MatchStateClient,
} from "./types.js";
import {
    createOrderedDeck,
    defensible,
    isSameCard,
    shuffleDeck,
} from "./utils.js";

export const gameDefinition = {
    id: "card-durak",
    createEngine: () => new DurakEngine(),
};

export const DURAK_DRAW_CARD_LIMIT = 6;
export const INVALID_ATTACK_MSG =
    "Invalid attack. Attack again with different cards.";
export const INVALID_DEFEND_MSG =
    "Invalid defend. Defend again with different cards.";

const startMatch = (state: MatchState, userId: string): MatchState => {
    const { players, status } = state;

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

    let deck = shuffleDeck(createOrderedDeck());
    let playerHands: Record<string, Card[]> = {};
    let drawPile: Card[] = [];
    let trumpCard: Card;
    let attackerId = players[(Math.random() * players.length) | 0].userId;

    for (let p of players) {
        const { userId } = p;
        playerHands[userId] = [];
        for (let i = 0; i < DURAK_DRAW_CARD_LIMIT; i++) {
            let lastCard = deck.pop();
            playerHands[userId].push(lastCard);
        }
    }
    trumpCard = deck[0];
    drawPile = deck;

    return {
        ...state,
        status: "PLAYING",
        gameState: {
            ...state.gameState,
            trumpCard,
            drawPile,
            playerHands,
            attackerId,
        },
    };
};

const attack = (
    state: MatchState,
    userId: string,
    cards: Card[],
): MatchState => {
    const { players, status, gameState } = state;
    const { attackerId, playerHands, tablePairs } = gameState;

    let isPlayer = players.some((p) => p.userId === userId);
    let isPlaying = status === "PLAYING";
    let isAttacker = attackerId === userId;
    if (!isPlayer) {
        throw new Error(NOT_A_PLAYER_MSG);
    }
    if (!isPlaying) {
        throw new Error(GAME_NOT_STARTED_MSG);
    }
    if (!isAttacker) {
        throw new Error(NOT_YOUR_TURN_MSG);
    }
    // first cards attack must all have the same rank
    if (!tablePairs.length) {
        for (let card of cards) {
            if (card.rank !== cards[0].rank) {
                throw new Error(INVALID_ATTACK_MSG);
            }
        }
    }

    let tableRanks = new Set<string>();
    for (let pair of tablePairs) {
        tableRanks.add(pair.attackCard.rank);
        tableRanks.add(pair.defendCard!.rank);
    }
    if (tablePairs.length > 0) {
        for (let card of cards) {
            if (!tableRanks.has(card.rank)) {
                throw new Error(INVALID_ATTACK_MSG);
            }
        }
    }

    let newPlayerHands = { ...playerHands };
    newPlayerHands[userId] = newPlayerHands[userId].filter(
        (card) => !cards.some((c) => isSameCard(card, c)),
    );

    let newTablePairs = [...tablePairs];
    for (let card of cards) {
        newTablePairs.push({ attackCard: card });
    }

    let endState: EndGameState | null = null;
    if (newPlayerHands[userId].length === 0) {
        endState = {
            reason: "EMPTY_HAND",
            winnerUserId: userId,
        };
    }

    return {
        ...state,
        status: endState ? "ENDED" : "PLAYING",
        gameState: {
            ...state.gameState,
            playerHands: newPlayerHands,
            tablePairs: newTablePairs,
            endState,
        },
    };
};

const pass = (state: MatchState, userId: string): MatchState => {
    const { players, status, gameState } = state;
    const { attackerId, playerHands, tablePairs, discardPile, drawPile } =
        gameState;

    let isPlayer = players.some((p) => p.userId === userId);
    let isPlaying = status === "PLAYING";
    let isAttacker = attackerId === userId;
    if (!isPlayer) {
        throw new Error(NOT_A_PLAYER_MSG);
    }
    if (!isPlaying) {
        throw new Error(GAME_NOT_STARTED_MSG);
    }
    if (!isAttacker) {
        throw new Error(NOT_YOUR_TURN_MSG);
    }

    // can only pass if every attack card has a defend card
    for (let pair of tablePairs) {
        if (!pair.defendCard) {
            throw new Error(INVALID_ACTION_MSG);
        }
    }

    // throw away table pairs
    let newDiscardPile = [...discardPile];
    for (let { attackCard, defendCard } of tablePairs) {
        newDiscardPile.push(attackCard);
        newDiscardPile.push(defendCard);
    }

    // fill player hands, attacker first
    let newDrawPile = [...drawPile];
    let newPlayerHands = { ...playerHands };
    let attackerHand = newPlayerHands[attackerId];
    while (
        attackerHand.length < DURAK_DRAW_CARD_LIMIT &&
        newDrawPile.length > 0
    ) {
        attackerHand.push(newDrawPile.pop());
    }
    for (let id in newPlayerHands) {
        if (id !== attackerId) {
            while (
                newPlayerHands[id].length < DURAK_DRAW_CARD_LIMIT &&
                newDrawPile.length > 0
            ) {
                newPlayerHands[id].push(newDrawPile.pop());
            }
        }
    }

    // next attacker id
    let id = players.findIndex((p) => p.userId === attackerId);
    let newAttackerId = players[(id + 1) % players.length].userId;

    return {
        ...state,
        gameState: {
            ...gameState,
            tablePairs: [],
            playerHands: newPlayerHands,
            drawPile: newDrawPile,
            attackerId: newAttackerId,
            discardPile: newDiscardPile,
        },
    };
};

const defend = (
    state: MatchState,
    userId: string,
    cards: Card[],
): MatchState => {
    const { players, status, gameState } = state;
    const { trumpCard, attackerId, playerHands, tablePairs } = gameState;

    let isPlayer = players.some((p) => p.userId === userId);
    let isPlaying = status === "PLAYING";
    let isDefender = attackerId != userId;
    if (!isPlayer) {
        throw new Error(NOT_A_PLAYER_MSG);
    }
    if (!isPlaying) {
        throw new Error(GAME_NOT_STARTED_MSG);
    }
    if (!isDefender) {
        throw new Error(NOT_YOUR_TURN_MSG);
    }

    let countDefended = 0;
    for (let pair of tablePairs) {
        if (
            !pair.defendCard &&
            defensible({
                attackCard: pair.attackCard,
                defendCard: cards[countDefended],
                trumpSuit: trumpCard.suit,
            })
        ) {
            countDefended++;
        }
    }

    if (countDefended !== cards.length) {
        throw new Error(INVALID_DEFEND_MSG);
    }

    let newPlayerHands = { ...playerHands };
    newPlayerHands[userId] = newPlayerHands[userId].filter(
        (card) => !cards.some((c) => isSameCard(card, c)),
    );

    let newTablePairs = [...tablePairs];
    let j = 0;
    for (let i = 0; i < newTablePairs.length; i++) {
        let { defendCard } = newTablePairs[i];
        if (!defendCard) {
            newTablePairs[i] = { ...newTablePairs[i], defendCard: cards[j] };
            j++;
        }
    }

    let endState: EndGameState | null = null;
    if (newPlayerHands[userId].length === 0) {
        endState = {
            reason: "EMPTY_HAND",
            winnerUserId: userId,
        };
    }

    return {
        ...state,
        status: endState ? "ENDED" : "PLAYING",
        gameState: {
            ...state.gameState,
            playerHands: newPlayerHands,
            tablePairs: newTablePairs,
            endState,
        },
    };
};

const take = (state: MatchState, userId: string): MatchState => {
    const { players, status, gameState } = state;
    const { attackerId, playerHands, tablePairs, discardPile, drawPile } =
        gameState;

    let isPlayer = players.some((p) => p.userId === userId);
    let isPlaying = status === "PLAYING";
    let isDefender = attackerId != userId;
    if (!isPlayer) {
        throw new Error(NOT_A_PLAYER_MSG);
    }
    if (!isPlaying) {
        throw new Error(GAME_NOT_STARTED_MSG);
    }
    if (!isDefender) {
        throw new Error(NOT_YOUR_TURN_MSG);
    }

    // push all table pairs into player hands
    let newPlayerHands = { ...playerHands };
    for (let { attackCard, defendCard } of tablePairs) {
        newPlayerHands[userId].push(attackCard);
        if (defendCard) {
            newPlayerHands[userId].push(defendCard);
        }
    }

    // fill player hands, attacker first
    let newDrawPile = [...drawPile];
    let attackerHand = newPlayerHands[attackerId];
    while (
        attackerHand.length < DURAK_DRAW_CARD_LIMIT &&
        newDrawPile.length > 0
    ) {
        attackerHand.push(newDrawPile.pop());
    }
    for (let id in newPlayerHands) {
        if (id !== attackerId) {
            while (
                newPlayerHands[id].length < DURAK_DRAW_CARD_LIMIT &&
                newDrawPile.length > 0
            ) {
                newPlayerHands[id].push(newDrawPile.pop());
            }
        }
    }

    return {
        ...state,
        gameState: {
            ...gameState,
            tablePairs: [],
            playerHands: newPlayerHands,
            drawPile: newDrawPile,
        },
    };
};

export class DurakEngine implements IGameEngine<
    DurakState,
    DurakAction,
    DurakStateClient
> {
    createNewMatchState(matchType: MatchType): MatchState {
        return {
            ...newMatch(gameDefinition.id, matchType),
            gameState: {
                drawPile: [],
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
                case "ATTACK": {
                    const { userId, cards } = action;
                    newState = attack(state, userId, cards);
                    break;
                }
                case "PASS": {
                    const { userId } = action;
                    newState = pass(state, userId);
                    break;
                }
                case "DEFEND": {
                    const { userId, cards } = action;
                    newState = defend(state, userId, cards);
                    break;
                }
                case "TAKE": {
                    const { userId } = action;
                    newState = take(state, userId);
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
                error: error,
            };
        }
    }

    convertToClientMatchState(
        match: Match<DurakState>,
        userId: string,
    ): MatchStateClient {
        const { gameState, players } = match;
        const { drawPile, discardPile, playerHands } = gameState;
        const playerHand = playerHands[userId] ?? [];
        const enemyHandCount = (
            playerHands[players.find((p) => p.userId !== userId)?.userId] ?? []
        ).length;

        return {
            ...match,
            gameState: {
                ...gameState,
                drawPile: undefined,
                discardPile: undefined,
                playerHands: undefined,

                drawPileCount: drawPile.length,
                discardPileCount: discardPile.length,
                playerHand,
                enemyHandCount,
            },
        };
    }
}

export * from "./types.js";
export * from "./utils.js";
