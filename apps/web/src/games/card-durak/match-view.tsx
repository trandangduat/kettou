import { useState, type Dispatch, type SetStateAction } from "react";
import {
    isSameCard,
    type Card,
    type DurakEngine,
    type MatchState,
} from "@mini-games/game-card-durak";
import { PlayingCard, PlayingCardBack } from "./card";
import cn from "cnfast";

type MatchViewParams = {
    match: MatchState;
    setMatch: Dispatch<SetStateAction<MatchState>>;
    user: any;
    engine: DurakEngine;
    handleAction: (action: any) => void;
};

export function MatchView({
    match,
    setMatch,
    user,
    engine,
    handleAction,
}: MatchViewParams) {
    const { gameState, players, status } = match;
    const {
        trumpCard,
        drawPile,
        discardPile,
        tablePairs,
        playerHands,
        attackerId,
    } = gameState;

    const [chosenCards, setChosenCards] = useState<Card[]>([]);

    if (status !== "PLAYING") {
        return null;
    }

    // drawPile, enemy hand and discard pile must be secret
    let isAttacker = attackerId === user.id;
    let handCards: Card[] = playerHands[user.id];
    let enemyId = players.filter((p) => p.userId !== user.id)[0].userId;
    let enemyHandLength = playerHands[enemyId]?.length ?? 0;

    const handleAttack = () => {
        if (chosenCards.length === 0) return;
        handleAction({
            type: "ATTACK",
            userId: user.id,
            cards: chosenCards,
        });
        setChosenCards([]);
    };

    const handlePass = () => {
        handleAction({
            type: "PASS",
            userId: user.id,
        });
        setChosenCards([]);
    };

    const handleDefend = () => {
        if (chosenCards.length === 0) return;
        handleAction({
            type: "DEFEND",
            userId: user.id,
            cards: chosenCards,
        });
        setChosenCards([]);
    };

    const handleTake = () => {
        handleAction({
            type: "TAKE",
            userId: user.id,
        });
        setChosenCards([]);
    };

    return (
        <div>
            <p>
                {isAttacker ? "You are the attacker" : "You are the defender"}
            </p>
            <Board>
                <div className="flex flex-row gap-1 h-full justify-between items-center px-6">
                    <DrawPile
                        quantity={drawPile.length}
                        trumpCard={trumpCard}
                    />
                    <div className="flex flex-col justify-between items-center h-full flex-1">
                        <EnemyHand quantity={enemyHandLength} />
                        <div className="flex flex-row gap-4">
                            {tablePairs.map((pair, _) => (
                                <TablePair
                                    key={
                                        pair.attackCard.suit +
                                        pair.attackCard.rank
                                    }
                                    attackCard={pair.attackCard}
                                    defendCard={pair.defendCard}
                                />
                            ))}
                        </div>
                        <YourHand
                            chosenCards={chosenCards}
                            setChosenCards={setChosenCards}
                            cards={handCards}
                        />
                    </div>
                    <DiscardPile quantity={discardPile.length} />
                </div>
            </Board>
            {isAttacker ? (
                <AttackActions
                    handleAttack={handleAttack}
                    handlePass={handlePass}
                />
            ) : (
                <DefendActions
                    handleDefend={handleDefend}
                    handleTake={handleTake}
                />
            )}
        </div>
    );
}

const buttonStyle = `hover:font-bold cursor-pointer`;

function AttackActions({
    className,
    handleAttack,
    handlePass,
}: {
    className?: string;
    handleAttack: () => void;
    handlePass: () => void;
}) {
    return (
        <div className="flex gap-2">
            <button className={buttonStyle} onClick={handleAttack}>
                Attack
            </button>
            <button className={buttonStyle} onClick={handlePass}>
                Pass
            </button>
        </div>
    );
}

function DefendActions({
    className,
    handleDefend,
    handleTake,
}: {
    className?: string;
    handleDefend: () => void;
    handleTake: () => void;
}) {
    return (
        <div className="flex gap-2">
            <button className={buttonStyle} onClick={handleDefend}>
                Defend
            </button>
            <button className={buttonStyle} onClick={handleTake}>
                Take
            </button>
        </div>
    );
}

function Board({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "bg-green-800 w-2xl h-2xl aspect-square p-4",
                className,
            )}
        >
            {children}
        </div>
    );
}

function EnemyHand({ quantity }: { quantity: number }) {
    return (
        <div className="flex gap-1">
            {Array.from({ length: quantity }).map((_, i) => (
                <PlayingCardBack key={i} />
            ))}
        </div>
    );
}

function YourHand({
    cards,
    chosenCards,
    setChosenCards,
}: {
    cards: Card[];
    chosenCards: Card[];
    setChosenCards: Dispatch<SetStateAction<Card[]>>;
}) {
    if (!cards) return null;

    const handleCardClick = (isChosen: boolean, card: Card) => {
        if (isChosen) {
            setChosenCards(chosenCards.filter((c) => !isSameCard(c, card)));
        } else {
            setChosenCards([...chosenCards, card]);
        }
    };

    return (
        <div className="flex gap-1">
            {cards.map((card, i) => {
                const isChosen = chosenCards.some((c) => isSameCard(c, card));

                return (
                    <PlayingCard
                        key={card.suit + card.rank}
                        suit={card.suit}
                        rank={card.rank}
                        onClick={() => handleCardClick(isChosen, card)}
                        className={cn(isChosen ? "-translate-y-4" : "")}
                    />
                );
            })}
        </div>
    );
}

function TablePair({
    attackCard,
    defendCard,
}: {
    attackCard: Card;
    defendCard?: Card;
}) {
    if (!attackCard) return null;
    return (
        <div className="inline-grid">
            <PlayingCard
                suit={attackCard.suit}
                rank={attackCard.rank}
                className="col-start-1 row-start-1"
            />
            {defendCard && (
                <PlayingCard
                    suit={defendCard.suit}
                    rank={defendCard.rank}
                    className="col-start-1 row-start-1 translate-6"
                />
            )}
        </div>
    );
}

function DrawPile({
    quantity,
    trumpCard,
}: {
    quantity: number;
    trumpCard?: Card;
}) {
    quantity = quantity > 3 ? 3 : quantity;

    const offset = [`-translate-y-0`, `-translate-y-1`, `-translate-y-2`];

    return (
        <div className="inline-grid">
            {trumpCard && (
                <PlayingCard
                    suit={trumpCard.suit}
                    rank={trumpCard.rank}
                    className="col-start-1 row-start-1 -translate-6 -rotate-7"
                />
            )}
            {Array.from({ length: quantity }).map((_, i) => (
                <PlayingCardBack
                    key={i}
                    className={cn("col-start-1 row-start-1", offset[i])}
                />
            ))}
        </div>
    );
}

function DiscardPile({ quantity }: { quantity: number }) {
    quantity = quantity > 5 ? 5 : quantity;

    const randomOffset = [
        `translate-x-2 translate-y-2 -rotate-7`,
        `translate-x-4 -translate-y-5 -rotate-4`,
        `-translate-x-2 translate-y-2 rotate-4`,
        `translate-x-3 -translate-y-1 -rotate-2`,
        `-translate-x-5 translate-y-6 rotate-9`,
    ];

    return (
        <div className="inline-grid">
            {Array.from({ length: quantity }).map((_, i) => (
                <PlayingCardBack
                    key={i}
                    className={cn("col-start-1 row-start-1", randomOffset[i])}
                />
            ))}
        </div>
    );
}
