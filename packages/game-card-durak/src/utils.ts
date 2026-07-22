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

/*
  this will return a directed graph,
  edge A -> B means card A can defend card B
*/
export const createDefensibleGraph = (
    attackCards: Card[],
    defendCards: Card[],
    trumpSuit: CardSuit,
): Map<Card, Card[]> => {
    const graph: Map<Card, Card[]> = new Map();
    for (let defendCard of defendCards) {
        graph.set(defendCard, []);
        for (let attackCard of attackCards) {
            if (defensible({ attackCard, defendCard, trumpSuit })) {
                graph.get(defendCard).push(attackCard);
            }
        }
    }
    return graph;
};

/*
  this will return a map of matched cards using the Kuhn algorithm,
  where key is the attack card and value is the defend card
*/
export const kuhnAlgorithm = (graphs: Map<Card, Card[]>): Map<Card, Card> => {
    let matched: Map<Card, Card> = new Map();

    const dfs = (node: Card, visited: Set<Card>): boolean => {
        if (visited.has(node)) {
            return false;
        }
        visited.add(node);
        for (let v of graphs.get(node)) {
            if (!matched.get(v) || dfs(matched.get(v), visited)) {
                matched.set(v, node);
                return true;
            }
        }
        return false;
    };

    for (let card of graphs.keys()) {
        let visited: Set<Card> = new Set();
        dfs(card, visited);
    }
    return matched;
};
