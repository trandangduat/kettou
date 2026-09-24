import type { ComponentType } from "react";
import { Button } from "#/components/ui/button";
import {
    FlagIcon,
    PlayIcon,
    SignOutIcon,
    BookOpenIcon,
    CircleNotchIcon,
    SidebarSimpleIcon,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import type { Match, Player, UserAvatar } from "@mini-games/core";

export interface GameArenaProps {
    match: Match<any>;
    setMatch: (match: Match<any>) => void;
    user?: { id: string; avatarUrls?: UserAvatar } | null;
    gameId: string;
    engine: any;
    MatchView?: ComponentType<any>;
    wasMatchStarted: boolean;
    isHost: boolean;
    opponentPlayer?: Player;
    isSidebarOpen?: boolean;
    onToggleSidebar?: () => void;
    onStartMatch: () => void;
    onHowToPlay?: () => void;
    onAction: (action: any) => void;
    onDraw: () => void;
    onSurrender: () => void;
    onLeaveMatch: () => void;
}

export function GameArena({
    match,
    setMatch,
    user,
    gameId,
    engine,
    MatchView,
    wasMatchStarted,
    isHost,
    opponentPlayer,
    isSidebarOpen = true,
    onToggleSidebar,
    onStartMatch,
    onHowToPlay,
    onAction,
    onDraw,
    onSurrender,
    onLeaveMatch,
}: GameArenaProps) {
    return (
        <div className="flex-1 min-h-0 relative rounded-lg bg-card border border-border/60 flex flex-col overflow-hidden">
            {/* Sidebar Toggle Button in Game Board Card */}
            {onToggleSidebar && (
                <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    onClick={onToggleSidebar}
                    title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
                    className="absolute top-3 right-3 z-30 shadow-xs cursor-pointer hover:text-foreground text-muted-foreground bg-card/85 backdrop-blur-xs border border-border/60 hover:bg-muted"
                >
                    <SidebarSimpleIcon className="size-4" weight={isSidebarOpen ? "regular" : "fill"} />
                </Button>
            )}
            {/* Game Board Stage with Pre-match Overlay */}
            <div className="flex-1 min-h-0 relative flex items-center justify-center overflow-hidden">
                {/* Pre-match Overlay */}
                {!wasMatchStarted && (
                    <PreMatchOverlay
                        isHost={isHost}
                        opponentPlayer={opponentPlayer}
                        onStartMatch={onStartMatch}
                        onHowToPlay={onHowToPlay}
                    />
                )}

                {/* Actual Game Board View */}
                <div className="w-full h-full flex flex-col items-center justify-center overflow-auto">
                    {MatchView ? (
                        <MatchView
                            match={match}
                            setMatch={setMatch}
                            user={user}
                            engine={engine}
                            handleAction={onAction}
                        />
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            Game UI unavailable for {gameId}.
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions*/}
            <ArenaFooter
                onDraw={onDraw}
                onSurrender={onSurrender}
                onLeaveMatch={onLeaveMatch}
            />
        </div>
    );
}

interface PreMatchOverlayProps {
    isHost: boolean;
    opponentPlayer?: Player;
    onStartMatch: () => void;
    onHowToPlay?: () => void;
}

function PreMatchOverlay({
    isHost,
    onStartMatch,
    onHowToPlay,
}: PreMatchOverlayProps) {
    const handleHowToPlay = () => {
        if (onHowToPlay) {
            onHowToPlay();
        } else {
            toast("Rules and how to play guide coming soon!", { icon: "📖" });
        }
    };

    return (
        <div className="absolute inset-0 z-20 bg-background flex flex-col items-center justify-center gap-4 p-6 text-center">
            {isHost ? (
                <div className="flex flex-col items-center gap-2.5 animate-in fade-in zoom-in-95 max-w-sm">
                    <Button
                        onClick={onStartMatch}
                        size="2xl"
                        className="gap-3 px-10 text-lg sm:text-xl font-space-grotesk font-black uppercase tracking-tight shadow-md cursor-pointer"
                    >
                        <PlayIcon className="size-6" weight="fill" />
                        <span>START MATCH</span>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleHowToPlay}
                        className="gap-1.5 text-sm normal-case font-inter text-muted-foreground hover:text-foreground font-semibold tracking-tight cursor-pointer"
                    >
                        <BookOpenIcon className="size-3.5" />
                        <span>How to play</span>
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2.5 animate-in fade-in zoom-in-95 max-w-sm">
                    <div className="flex items-center gap-3 text-primary font-space-grotesk font-black text-lg sm:text-xl uppercase tracking-tight">
                        <CircleNotchIcon className="size-6 animate-spin shrink-0" />
                        <span>Waiting for Host to Start</span>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleHowToPlay}
                        className="gap-1.5 text-sm normal-case font-inter text-muted-foreground hover:text-foreground font-semibold tracking-tight cursor-pointer"
                    >
                        <BookOpenIcon className="size-3.5" />
                        <span>How to play</span>
                    </Button>
                </div>
            )}
        </div>
    );
}

interface ArenaFooterProps {
    onDraw: () => void;
    onSurrender: () => void;
    onLeaveMatch: () => void;
}

function ArenaFooter({
    onDraw,
    onSurrender,
    onLeaveMatch,
}: ArenaFooterProps) {
    return (
        <div className="w-full px-4 py-2.5 border-t border-border/40 flex items-center justify-end gap-2.5 z-30 shrink-0 bg-muted/5">
            <Button
                type="button"
                variant="secondary"
                onClick={onDraw}
                className="h-9 px-3.5 font-sans font-medium normal-case tracking-normal text-xs sm:text-sm cursor-pointer shadow-xs gap-1.5"
            >
                <span className="font-bold text-sm">½</span>
                <span>Offer Draw</span>
            </Button>
            <Button
                type="button"
                variant="secondary"
                onClick={onSurrender}
                className="h-9 px-3.5 font-sans font-medium normal-case tracking-normal text-xs sm:text-sm cursor-pointer gap-1.5 shadow-xs"
            >
                <FlagIcon className="size-4" />
                <span>Surrender</span>
            </Button>
            <Button
                type="button"
                variant="destructive"
                onClick={onLeaveMatch}
                className="h-9 px-3.5 font-sans font-medium normal-case tracking-normal text-xs sm:text-sm cursor-pointer gap-1.5 shadow-xs"
            >
                <SignOutIcon className="size-4" />
                <span>Leave Match</span>
            </Button>
        </div>
    );
}
