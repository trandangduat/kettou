import { Card, CARD_RANKS, CARD_SUITS, CardSuit } from "./types.js";

export const createOrderedDeck = (): Card[] => {
    const deck: Card[] = [];
    for (let rank of CARD_RANKS) {
        for (let suit of CARD_SUITS) {
            deck.push({ rank, suit });
        }
    }
    return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
    const newDeck = [...deck];
    const n = deck.length;
    for (let i = 0; i < n; i++) {
        let j = Math.floor(Math.random() * n);
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
};

export const isSameCard = (a: Card, b: Card): boolean => {
    return a.rank === b.rank && a.suit === b.suit;
};

export const compareRank = (a: Card, b: Card): boolean => {
    let x = CARD_RANKS.findIndex((r) => r === a.rank);
    let y = CARD_RANKS.findIndex((r) => r === b.rank);
    if (x < 0 || y < 0) {
        return false;
    }
    return x > y;
};

export const defensible = ({
    attackCard,
    defendCard,
    trumpSuit,
}: {
    attackCard: Card;
    defendCard: Card;
    trumpSuit: CardSuit;
}): boolean => {
    if (defendCard.suit === trumpSuit) {
        if (attackCard.suit === trumpSuit) {
            return compareRank(defendCard, attackCard);
        }
        return true;
    }
    return (
        defendCard.suit === attackCard.suit &&
        compareRank(defendCard, attackCard)
    );
};
