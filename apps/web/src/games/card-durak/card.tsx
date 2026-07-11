import type { CardRank, CardSuit } from "@mini-games/game-card-durak";
import cn from "cnfast";

export function PlayingCard({
    suit,
    rank,
    className,
    onClick,
}: {
    suit: CardSuit;
    rank: CardRank;
    className?: string;
    onClick?: () => void;
}) {
    let suitSymbol = "";
    let cardColor = "";
    switch (suit) {
        case "CLUBS":
            suitSymbol = "♣";
            cardColor = "text-black";
            break;
        case "DIAMONDS":
            suitSymbol = "♦";
            cardColor = "text-red-600";
            break;
        case "HEARTS":
            suitSymbol = "♥";
            cardColor = "text-red-600";
            break;
        case "SPADES":
            suitSymbol = "♠";
            cardColor = "text-black";
            break;
    }
    return (
        <div
            className={cn`cursor-grab active:cursor-grabbing bg-white relative w-14 aspect-2/3 hover:shadow-md font-bold rounded-md border border-black ${cardColor} ${className}`}
            onClick={onClick}
        >
            <span className="absolute left-1 top-1 flex flex-col items-center text-sm leading-none">
                <span>{rank}</span>
                <span>{suitSymbol}</span>
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-5xl">
                {suitSymbol}
            </span>
        </div>
    );
}

export function PlayingCardBack({ className }: { className?: string }) {
    return (
        <div
            className={cn`bg-white flex w-14 p-1 aspect-2/3 text-2xl hover:shadow-md rounded-md border border-black ${className}`}
        >
            <div className="bg-blue-800 w-full h-full rounded-sm"></div>
        </div>
    );
}
