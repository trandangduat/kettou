import { useState } from "react";
import {
    CheckIcon,
    CopyIcon,
    TrophyIcon,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import type { Match } from "@mini-games/core";
import { Badge } from "#/components/ui/badge";
import { timeAgo } from "../../../../../../utils";
import CardDurakImg from "#/assets/card-durak.png";
import DiceTerritoryImg from "#/assets/dice-territory.png";

const GAME_IMAGES: Record<string, string> = {
    "dice-territory": DiceTerritoryImg,
    "card-durak": CardDurakImg,
};

const GAME_NAMES: Record<string, string> = {
    "dice-territory": "Dice Territory",
    "card-durak": "Card Durak",
};

const STATUS_TEXT: Record<string, string> = {
    WAITING: "text-amber-300",
    READY: "text-emerald-300",
    PLAYING: "text-sky-300",
    ENDED: "text-muted-foreground",
};

function formatGameName(gameId: string): string {
    if (GAME_NAMES[gameId]) return GAME_NAMES[gameId];
    return gameId
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export interface MatchInfoCardProps {
    match: Match<any>;
    gameId: string;
}

export function MatchInfoCard({ match, gameId }: MatchInfoCardProps) {
    const [copied, setCopied] = useState(false);
    const gameArt = GAME_IMAGES[gameId];
    const gameName = formatGameName(gameId);
    const status = match.status || "WAITING";
    const statusColor = STATUS_TEXT[status] || STATUS_TEXT.WAITING;
    const isRanked = match.type === "RANKED";

    const copyMatchId = () => {
        navigator.clipboard.writeText(match.id);
        setCopied(true);
        toast.success("Match ID copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-xl bg-card border border-border/60 overflow-hidden shadow-xs shrink-0 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {gameArt && (
                        <img
                            src={gameArt}
                            alt={gameName}
                            className="size-12 rounded-xl object-cover border border-border/60 shrink-0"
                        />
                    )}
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-space-grotesk font-bold text-xl text-foreground tracking-tight leading-tight truncate">
                            {gameName}
                        </span>
                        <button
                            type="button"
                            onClick={copyMatchId}
                            title="Click to copy matchId"
                            className="group flex items-center gap-1.5 min-w-0 cursor-pointer text-left"
                        >
                            <span className="font-medium text-[13px] text-muted-foreground group-hover:text-foreground transition-colors uppercase truncate">
                                #{match.id}
                            </span>
                            {copied ? (
                                <CheckIcon className="size-3.5 text-emerald-400 shrink-0" />
                            ) : (
                                <CopyIcon className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                            )}
                        </button>
                    </div>
                </div>

                <Badge
                    variant={isRanked ? "ranked" : "neutral"}
                    className="capitalize shrink-0"
                >
                    {isRanked && (
                        <TrophyIcon
                            className="size-3"
                            weight="fill"
                        />
                    )}
                    {isRanked ? "Ranked" : "Custom"}
                </Badge>
            </div>

            <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
                <div className="flex items-center justify-between gap-3">
                    <span className="font-sans text-[13px] text-muted-foreground">
                        Status
                    </span>
                    <span
                        className={`font-sans text-[13px] font-medium capitalize truncate ${statusColor}`}
                    >
                        {status.toLowerCase()}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className="font-sans text-[13px] text-muted-foreground">
                        Created
                    </span>
                    <span
                        className="font-sans text-[13px] text-muted-foreground truncate"
                        title={new Date(match.createdAt).toLocaleString()}
                    >
                        {timeAgo(match.createdAt)}
                    </span>
                </div>
            </div>
        </div>
    );
}
