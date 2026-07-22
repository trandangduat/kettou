import { describe, it, expect } from "vitest";
import { Card } from "./types.js";
import { createDefensibleGraph, kuhnAlgorithm } from "./utils.js";

describe("kuhnAlgorithm", () => {
    it("defensible: n_o defends cards = n_o attack cards", () => {
        const trumpCard = {
            rank: "10",
            suit: "SPADES",
        } as Card;
        const card1 = {
            rank: "7",
            suit: "CLUBS",
        } as Card;
        const card2 = {
            rank: "7",
            suit: "SPADES",
        } as Card;
        const card3 = {
            rank: "7",
            suit: "HEARTS",
        } as Card;

        const card4 = {
            rank: "8",
            suit: "SPADES",
        } as Card;
        const card5 = {
            rank: "6",
            suit: "SPADES",
        } as Card;
        const card6 = {
            rank: "9",
            suit: "CLUBS",
        } as Card;
        const attackCards: Card[] = [card1, card2, card3];
        const defendCards: Card[] = [card4, card5, card6];

        const graph = createDefensibleGraph(attackCards, defendCards, trumpCard.suit);
        const result = kuhnAlgorithm(graph);

        console.log(graph);
        console.log(result);

        expect(result.size).toBe(3);
    });
    it("defensible: n_o defends cards < n_o attack cards", () => {
        const trumpCard = {
            rank: "10",
            suit: "SPADES",
        } as Card;
        const card1 = {
            rank: "9",
            suit: "CLUBS",
        } as Card;
        const card2 = {
            rank: "9",
            suit: "SPADES",
        } as Card;
        const card3 = {
            rank: "9",
            suit: "HEARTS",
        } as Card;

        const card4 = {
            rank: "8",
            suit: "SPADES",
        } as Card;
        const card5 = {
            rank: "6",
            suit: "SPADES",
        } as Card;

        const attackCards: Card[] = [card1, card2, card3];
        const defendCards: Card[] = [card4, card5];

        const graph = createDefensibleGraph(attackCards, defendCards, trumpCard.suit);
        const result = kuhnAlgorithm(graph);

        console.log(graph);
        console.log(result);

        expect(result.size).toBe(2);
    });

    it("indefensible: n_o defends cards = n_o attack cards", () => {
        const trumpCard = {
            rank: "10",
            suit: "SPADES",
        } as Card;
        const card1 = {
            rank: "9",
            suit: "CLUBS",
        } as Card;
        const card2 = {
            rank: "9",
            suit: "SPADES",
        } as Card;
        const card3 = {
            rank: "9",
            suit: "HEARTS",
        } as Card;

        const card4 = {
            rank: "8",
            suit: "SPADES",
        } as Card;
        const card5 = {
            rank: "6",
            suit: "SPADES",
        } as Card;
        const card6 = {
            rank: "6",
            suit: "CLUBS",
        } as Card;

        const attackCards: Card[] = [card1, card2, card3];
        const defendCards: Card[] = [card4, card5, card6];

        const graph = createDefensibleGraph(attackCards, defendCards, trumpCard.suit);
        const result = kuhnAlgorithm(graph);

        console.log(graph);
        console.log(result);

        expect(result.size).toBe(2);
    });

    it("indefensible: n_o defends cards < n_o attack cards", () => {
        const trumpCard = {
            rank: "10",
            suit: "SPADES",
        } as Card;
        const card1 = {
            rank: "9",
            suit: "CLUBS",
        } as Card;
        const card2 = {
            rank: "9",
            suit: "SPADES",
        } as Card;
        const card3 = {
            rank: "9",
            suit: "HEARTS",
        } as Card;

        const card4 = {
            rank: "8",
            suit: "SPADES",
        } as Card;
        const card5 = {
            rank: "6",
            suit: "CLUBS",
        } as Card;

        const attackCards: Card[] = [card1, card2, card3];
        const defendCards: Card[] = [card4, card5];

        const graph = createDefensibleGraph(attackCards, defendCards, trumpCard.suit);
        const result = kuhnAlgorithm(graph);

        console.log(graph);
        console.log(result);

        expect(result.size).toBe(1);
    });
});
