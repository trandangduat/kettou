import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { StarFourIcon, UserIcon, WifiXIcon } from "@phosphor-icons/react";
import type { Player } from "@mini-games/core";
import { useEffect, useState } from "react";

function PlayerAvatar({
    player,
    fallbackClassName,
    fallbackLabel,
}: {
    player?: Player;
    fallbackClassName: string;
    fallbackLabel: string;
}) {
    const isOffline = player?.status === "OFFLINE";
    return (
        <div
            className="relative shrink-0"
            title={isOffline ? "Disconnected" : undefined}
        >
            <Avatar
                className={`size-14 sm:size-16 ${isOffline ? "opacity-50 grayscale" : ""}`}
            >
                <AvatarImage src={player?.avatarUrls?.small} />
                <AvatarFallback className={fallbackClassName}>
                    {player?.userId?.slice(0, 2).toUpperCase() || fallbackLabel}
                </AvatarFallback>
            </Avatar>
            {isOffline && (
                <span
                    title="Disconnected"
                    className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground ring-2 ring-card"
                >
                    <WifiXIcon className="size-3.5" weight="bold" />
                </span>
            )}
        </div>
    );
}

export interface VersusBarProps {
    hostId: string;
    you?: Player;
    opponent?: Player;
}

export function VersusBar({ hostId, you, opponent }: VersusBarProps) {
    const [opponentNow, setOpponentNow] = useState<number>(Date.now());
    const [youNow, setYouNow] = useState<number>(Date.now());

    useEffect(() => {
        if (you?.status !== "OFFLINE") {
            return;
        }

        setYouNow(Date.now())

        const intv = setInterval(() => {
            setYouNow(Date.now());
            if (Date.now() > you.reconnectUntil!) {
                clearInterval(intv);
            }
        }, 1000);

        return () => {
            clearInterval(intv);
        };
    }, [you?.status, you?.reconnectUntil]);

    useEffect(() => {
        if (opponent?.status !== "OFFLINE") {
            return;
        }

        setOpponentNow(Date.now())

        const intv = setInterval(() => {
            setOpponentNow(Date.now());
            if (Date.now() > opponent.reconnectUntil!) {
                clearInterval(intv);
            }
        }, 1000);

        return () => {
            clearInterval(intv);
        };
    }, [opponent?.status, opponent?.reconnectUntil]);

    const youRemain = you?.reconnectUntil
        ? Math.max(0, Math.ceil((you.reconnectUntil - youNow) / 1000))
        : 0;
    const opponentRemain = opponent?.reconnectUntil
        ? Math.max(0, Math.ceil((opponent.reconnectUntil - opponentNow) / 1000))
        : 0;

    return (
        <div className="w-full max-w-3xl mx-auto rounded-b-lg border-x border-b border-t-0 bg-card border-border/60 px-7 py-4 sm:px-9 sm:py-4.5 shadow-sm flex items-center justify-between gap-8">
             {/*Left: You (always left by default) */}
            <div className="flex-1 flex items-center gap-4 min-w-0">
                <PlayerAvatar
                    player={you}
                    fallbackClassName="bg-muted text-muted-foreground font-space-grotesk font-bold text-lg"
                    fallbackLabel="X"
                />

                <div className="flex flex-col min-w-0 gap-0.5">
                    <div className="flex items-center gap-2 truncate">
                        <span className="font-space-grotesk text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate max-w-44 sm:max-w-60">
                            {you?.userId || "Waiting..."}
                        </span>
                        <Badge size="sm"><UserIcon weight="fill" />YOU</Badge>
                    </div>

                    {you?.elo !== undefined && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground leading-none">
                            {you?.status === "OFFLINE" ? (
                                <span className="font-semibold text-destructive">
                                    Disconnected - {youRemain}s
                                </span>
                            ) : (
                                <span className="font-bold flex gap-1 items-center flex-row">
                                    {Math.round(you.elo)}
                                    <StarFourIcon weight="fill" size="12" />
                                </span>
                            )}
                        </span>
                    )}
                </div>
            </div>

            {/* Center VS */}
            <div className="shrink-0 flex items-center justify-center px-2 select-none">
                <span className="font-space-grotesk font-black text-base sm:text-2xl italic tracking-tight text-muted-foreground/80">
                    VS
                </span>
            </div>

            {/* Right: Opponent */}
            <div className="flex-1 flex flex-row-reverse items-center gap-4 min-w-0 text-right">
                {opponent ? (
                    <>
                        <PlayerAvatar
                            player={opponent}
                            fallbackClassName="bg-muted text-muted-foreground font-space-grotesk font-bold text-lg"
                            fallbackLabel="Y"
                        />

                        <div className="flex flex-col min-w-0 items-end gap-0.5">
                            <div className="flex items-center gap-2 truncate">
                                <span className="font-space-grotesk text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate max-w-44 sm:max-w-60">
                                    {opponent.userId}
                                </span>
                            </div>

                            {opponent.elo !== undefined && (
                                <span className="flex items-center gap-1.5 text-sm text-muted-foreground leading-none">
                                    {opponent?.status === "OFFLINE" ? (
                                        <span className="font-semibold text-destructive">
                                            Disconnected - {opponentRemain}s
                                        </span>
                                    ) : (
                                        <span className="font-bold flex gap-1 items-center flex-row">
                                            <StarFourIcon
                                                weight="fill"
                                                size="12"
                                            />
                                            {Math.round(opponent.elo)}
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="size-14 sm:size-16 rounded-full border-2 border-dashed border-border/80 flex items-center justify-center text-muted-foreground/30 font-space-grotesk font-bold text-lg shrink-0">
                            ?
                        </div>
                        <div className="flex flex-col min-w-0 items-end">
                            <span className="font-space-grotesk text-base font-bold tracking-tight text-muted-foreground/40 italic">
                                Waiting...
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
