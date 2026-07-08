export const CARD_RANKS = [
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
] as const;
export const CARD_SUITS = ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"] as const;

export type CardSuit = (typeof CARD_SUITS)[number];
export type CardRank = (typeof CARD_RANKS)[number];

export interface Card {
    suit: CardSuit;
    rank: string;
}

export interface TablePair {
    attackCards: Card[];
    defendCards: Card[];
}

export interface EndGameState {
    winnerUserId: string | null;
}

export interface DurakState {
    trumpCard?: Card;
    drawPile: Card[];
    discardPile: Card[];
    attackerId?: string;
    playerHands: Record<string, Card[]>;
    tablePairs: TablePair[];
    endState?: EndGameState;
}
