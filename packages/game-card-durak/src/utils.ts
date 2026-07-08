import { Card, CARD_RANKS, CARD_SUITS } from "./types.js";

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
