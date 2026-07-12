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
        endState,
    } = gameState;

    const [chosenCards, setChosenCards] = useState<Card[]>([]);

    if (status == "WAITING" || status == "READY") {
        return null;
    }

    // drawPile, enemy hand and discard pile must be secret
    let isAttacker = attackerId === user.id;
    let handCards: Card[] = playerHands[user.id];
    let enemyId = players.filter((p) => p.userId !== user.id)[0].userId;
    let enemyHandLength = playerHands[enemyId]?.length ?? 0;
    const isPlaying = status === "PLAYING";
    const hasTablePairs = tablePairs.length > 0;
    const hasUndefendedAttack = tablePairs.some((pair) => !pair.defendCard);
    const allAttacksDefended =
        hasTablePairs && tablePairs.every((pair) => Boolean(pair.defendCard));
    const canSelectCards =
        isPlaying &&
        ((isAttacker && !hasUndefendedAttack) ||
            (!isAttacker && hasUndefendedAttack));
    const canAttack =
        isPlaying &&
        isAttacker &&
        !hasUndefendedAttack &&
        chosenCards.length > 0;
    const canPass =
        isPlaying && isAttacker && hasTablePairs && allAttacksDefended;
    const canDefend =
        isPlaying &&
        !isAttacker &&
        hasUndefendedAttack &&
        chosenCards.length > 0;
    const canTake = isPlaying && !isAttacker && hasUndefendedAttack;
    const turnLabel = getTurnLabel({
        isAttacker,
        hasTablePairs,
        hasUndefendedAttack,
    });

    const handleAttack = () => {
        if (!canAttack) return;
        handleAction({
            type: "ATTACK",
            userId: user.id,
            cards: chosenCards,
        });
        setChosenCards([]);
    };

    const handlePass = () => {
        if (!canPass) return;
        handleAction({
            type: "PASS",
            userId: user.id,
        });
        setChosenCards([]);
    };

    const handleDefend = () => {
        if (!canDefend) return;
        handleAction({
            type: "DEFEND",
            userId: user.id,
            cards: chosenCards,
        });
        setChosenCards([]);
    };

    const handleTake = () => {
        if (!canTake) return;
        handleAction({
            type: "TAKE",
            userId: user.id,
        });
        setChosenCards([]);
    };

    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-white">
                <p className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold">
                    {isAttacker ? "You are the attacker" : "You are the defender"}
                </p>
                <p className="rounded-full bg-amber-500 px-3 py-1 text-sm font-bold text-slate-950 shadow">
                    {turnLabel}
                </p>
            </div>
            <Board className="flex flex-col items-center">
                <div className="grid h-full w-full grid-cols-[7rem_minmax(0,1fr)_7rem] items-center justify-items-center gap-3 px-2">
                    <DrawPile
                        quantity={drawPile.length}
                        trumpCard={trumpCard}
                    />
                    <div className="flex h-full min-w-0 flex-col items-center justify-between gap-3 overflow-hidden py-1">
                        <EnemyHand quantity={enemyHandLength} />
                        <div className="flex max-w-full flex-row flex-wrap justify-center gap-x-6 gap-y-5 px-2">
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
                            disabled={!canSelectCards}
                            showSelectionOrder={!isAttacker && hasUndefendedAttack}
                        />
                    </div>
                    <DiscardPile quantity={discardPile.length} />
                </div>
                <div className="mt-3">
                    {isAttacker ? (
                        <AttackActions
                            handleAttack={handleAttack}
                            handlePass={handlePass}
                            canAttack={canAttack}
                            canPass={canPass}
                        />
                    ) : (
                        <DefendActions
                            handleDefend={handleDefend}
                            handleTake={handleTake}
                            canDefend={canDefend}
                            canTake={canTake}
                        />
                    )}
                </div>
            </Board>
            {endState && endState.winnerUserId === user.id && (
                <div>
                    You <b className="text-emerald-600">won!</b>
                </div>
            )}
            {endState && endState.winnerUserId !== user.id && (
                <div>
                    You <b className="text-red-500">lost!</b>
                </div>
            )}
        </div>
    );
}

const buttonStyle = `rounded-full px-4 py-2 text-sm font-bold shadow transition disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none`;
const primaryButtonStyle = `${buttonStyle} bg-amber-400 text-slate-950 hover:bg-amber-300`;
const secondaryButtonStyle = `${buttonStyle} bg-slate-900 text-white hover:bg-slate-800`;

function getTurnLabel({
    isAttacker,
    hasTablePairs,
    hasUndefendedAttack,
}: {
    isAttacker: boolean;
    hasTablePairs: boolean;
    hasUndefendedAttack: boolean;
}) {
    if (isAttacker) {
        if (!hasTablePairs) return "Your turn: attack";
        if (hasUndefendedAttack) return "Waiting for defend";
        return "Your turn: attack or pass";
    }

    if (hasUndefendedAttack) return "Your turn: defend";
    return "Opponent's turn";
}

function splitIntoRows<T>(items: T[], maxRows = 2) {
    if (items.length <= 8 || maxRows === 1) return [items];

    const firstRowLength = Math.ceil(items.length / maxRows);
    return [items.slice(0, firstRowLength), items.slice(firstRowLength)];
}

function getRowSpacing(count: number) {
    if (count > 11) return "-space-x-7";
    if (count > 9) return "-space-x-5";
    if (count > 7) return "-space-x-3";
    return "space-x-1";
}

function AttackActions({
    className,
    handleAttack,
    handlePass,
    canAttack,
    canPass,
}: {
    className?: string;
    handleAttack: () => void;
    handlePass: () => void;
    canAttack: boolean;
    canPass: boolean;
}) {
    return (
        <div className={cn("flex gap-2", className)}>
            <button
                className={primaryButtonStyle}
                disabled={!canAttack}
                onClick={handleAttack}
            >
                Attack
            </button>
            <button
                className={secondaryButtonStyle}
                disabled={!canPass}
                onClick={handlePass}
            >
                Pass
            </button>
        </div>
    );
}

function DefendActions({
    className,
    handleDefend,
    handleTake,
    canDefend,
    canTake,
}: {
    className?: string;
    handleDefend: () => void;
    handleTake: () => void;
    canDefend: boolean;
    canTake: boolean;
}) {
    return (
        <div className={cn("flex gap-2", className)}>
            <button
                className={primaryButtonStyle}
                disabled={!canDefend}
                onClick={handleDefend}
            >
                Defend
            </button>
            <button
                className={secondaryButtonStyle}
                disabled={!canTake}
                onClick={handleTake}
            >
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
                "aspect-square h-2xl w-2xl bg-green-800 p-4",
                className,
            )}
        >
            {children}
        </div>
    );
}

function EnemyHand({ quantity }: { quantity: number }) {
    const rows = splitIntoRows(Array.from({ length: quantity }));

    return (
        <div className="flex max-w-full flex-col items-center gap-1 overflow-hidden">
            {rows.map((row, rowIndex) => (
                <div
                    key={rowIndex}
                    className={cn(
                        "flex justify-center",
                        getRowSpacing(row.length),
                    )}
                >
                    {row.map((_, i) => (
                        <PlayingCardBack key={`${rowIndex}-${i}`} />
                    ))}
                </div>
            ))}
        </div>
    );
}

function YourHand({
    cards,
    chosenCards,
    setChosenCards,
    disabled,
    showSelectionOrder,
}: {
    cards: Card[];
    chosenCards: Card[];
    setChosenCards: Dispatch<SetStateAction<Card[]>>;
    disabled: boolean;
    showSelectionOrder: boolean;
}) {
    if (!cards) return null;

    const handleCardClick = (isChosen: boolean, card: Card) => {
        if (disabled) return;

        if (isChosen) {
            setChosenCards(chosenCards.filter((c) => !isSameCard(c, card)));
        } else {
            setChosenCards([...chosenCards, card]);
        }
    };

    const rows = splitIntoRows(cards);

    return (
        <div className="flex max-w-full flex-col items-center gap-2 pb-4 pt-3">
            {rows.map((row, rowIndex) => (
                <div
                    key={rowIndex}
                    className={cn(
                        "flex justify-center",
                        getRowSpacing(row.length),
                    )}
                >
                    {row.map((card) => {
                        const selectionIndex = chosenCards.findIndex((c) =>
                            isSameCard(c, card),
                        );
                        const isChosen = selectionIndex >= 0;

                        return (
                            <div
                                key={card.suit + card.rank}
                                className="relative shrink-0"
                            >
                                {showSelectionOrder && isChosen && (
                                    <span className="absolute -top-3 left-1/2 z-30 flex h-6 min-w-6 -translate-x-1/2 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-black text-slate-950 shadow">
                                        {selectionIndex + 1}
                                    </span>
                                )}
                                <PlayingCard
                                    suit={card.suit}
                                    rank={card.rank}
                                    onClick={() =>
                                        handleCardClick(isChosen, card)
                                    }
                                    className={cn(
                                        disabled
                                            ? "cursor-not-allowed opacity-60"
                                            : "",
                                        isChosen ? "-translate-y-4" : "",
                                    )}
                                />
                            </div>
                        );
                    })}
                </div>
            ))}
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
        <div className="inline-grid pr-6 pb-6">
            <PlayingCard
                suit={attackCard.suit}
                rank={attackCard.rank}
                className="z-10 col-start-1 row-start-1"
            />
            {defendCard && (
                <PlayingCard
                    suit={defendCard.suit}
                    rank={defendCard.rank}
                    className="z-20 col-start-1 row-start-1 translate-6"
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
        <div className="inline-grid min-h-[5.25rem] min-w-14 place-items-center">
            {trumpCard && (
                <PlayingCard
                    suit={trumpCard.suit}
                    rank={trumpCard.rank}
                    className="col-start-1 row-start-1 -translate-y-12"
                />
            )}
            {Array.from({ length: quantity }).map((_, i) => (
                <PlayingCardBack
                    key={i}
                    className={cn("col-start-1 row-start-1", offset[i])}
                />
            ))}
            {!trumpCard && quantity === 0 && (
                <div className="col-start-1 row-start-1 h-[5.25rem] w-14 rounded-md border border-dashed border-white/40" />
            )}
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
        <div className="inline-grid min-h-[5.25rem] min-w-14 place-items-center">
            {Array.from({ length: quantity }).map((_, i) => (
                <PlayingCardBack
                    key={i}
                    className={cn("col-start-1 row-start-1", randomOffset[i])}
                />
            ))}
            {quantity === 0 && (
                <div className="col-start-1 row-start-1 h-[5.25rem] w-14 rounded-md border border-dashed border-white/40" />
            )}
        </div>
    );
}
