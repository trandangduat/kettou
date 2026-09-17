import {
    Card,
    CardContent,
    CardHeader,
} from "#/components/ui/card";
import { ArrowRightIcon, ClockIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import { timeAgo } from "../../../../utils";
import { PlayerSlot } from "./player-slot";
import type { Match } from "./types";

export interface RoomCardProps {
    match: Match;
    fallbackGameId?: string;
}

export function RoomCard({ match, fallbackGameId }: RoomCardProps) {
    const { players } = match;
    const gameId = match.gameId || fallbackGameId || "";
    const containerRef = useRef<HTMLAnchorElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);

    const updateIndicatorPosition = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!containerRef.current || !indicatorRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        indicatorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    return (
        <Link
            ref={containerRef}
            to="/$gameId/$matchId"
            params={{
                gameId,
                matchId: match.id,
            }}
            onMouseEnter={updateIndicatorPosition}
            onMouseMove={updateIndicatorPosition}
            className="group/room relative block rounded-[min(var(--radius-lg),24px)] outline-none focus-visible:ring-2 focus-visible:ring-primary select-none cursor-pointer hover:z-20"
        >
            <Card className="h-full bg-card border-border/60 group-hover/room:border-primary/40 group-hover/room:shadow-xl group-hover/room:scale-[1.03] transition-all duration-200 ease-out flex flex-col justify-between">
                <CardHeader className="flex flex-col items-center justify-between border-b border-border/60 border-dashed">
                    <span className="text-lg font-space-grotesk tracking-tight font-bold text-muted-foreground group-hover/room:text-foreground/90 transition-colors">
                        #{match.id}
                    </span>
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                        <ClockIcon className="size-3.5" weight="bold" />
                        <span>{timeAgo(match.createdAt)}</span>
                    </span>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-around">
                        <PlayerSlot player={players?.[0]} isHost />
                        <span className="text-xs font-bold text-muted-foreground/30 select-none">
                            VS
                        </span>
                        <PlayerSlot player={players?.[1]} />
                    </div>
                </CardContent>
            </Card>

            {/* Cursor-following indicator button centered on the mouse */}
            <div
                ref={indicatorRef}
                className="absolute top-0 left-0 pointer-events-none z-30 will-change-transform"
                style={{ transform: "translate3d(-100px, -100px, 0)" }}
            >
                <div style={{ transform: "translate(-50%, -50%)" }}>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs tracking-wide shadow-lg shadow-black/30 whitespace-nowrap opacity-0 scale-50 group-hover/room:opacity-100 group-hover/room:scale-100 transition-all duration-200 ease-out origin-center select-none">
                        <span>join match</span>
                        <ArrowRightIcon className="size-3.5" weight="bold" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
