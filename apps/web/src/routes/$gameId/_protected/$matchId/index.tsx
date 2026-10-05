import { socket } from "#/socket";
import { createFileRoute, useCanGoBack, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameRegistry, type Match } from "@mini-games/core";
import { GameUI } from "#/games";
import toast from "react-hot-toast";
import {
    VersusBar,
    GameArena,
    MatchInfoCard,
    BanterBoxCard,
} from "./-components";

export const Route = createFileRoute("/$gameId/_protected/$matchId/")({
    component: RouteComponent,
});

function RouteComponent() {
    const { gameId, matchId } = Route.useParams();
    const { user } = Route.useRouteContext();
    const engine = GameRegistry.getEngine(gameId);

    const [match, setMatch] = useState<Match<any>>(
        engine.createNewMatchState("CUSTOM"),
    );
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const hostPlayer = match?.players?.[0];
    const you = match?.players.find(p => p.userId === user?.id);
    const opponent = match?.players.find(p => p.userId !== user?.id);
    const isHost = user?.id === hostPlayer?.userId;
    const wasMatchStarted =
        match?.status !== "WAITING" && match?.status !== "READY";
    const router = useRouter();
    const canGoBack = useCanGoBack();

    const MatchView = GameUI[gameId];

    const goBack = () => {
        if (canGoBack) {
            router.history.back();
        } else {
            router.navigate({ to: "/browse" });
        }
    }

    const startMatch = () => {
        socket.emit(
            "match:start",
            matchId,
            ({ ok, error }: { ok: boolean; error?: string }) => {
                if (!ok) {
                    toast.error(error!);
                }
            },
        );
    };

    const handleAction = (action: any) => {
        socket.emit(
            "match:action",
            {
                matchId: match.id,
                action: action,
            },
            ({ ok, error }: { ok: boolean; error?: any }) => {
                if (!ok) {
                    toast.error(error!);
                }
            },
        );
    };

    const handleLeaveMatch = () => {
        socket.emit(
            "match:leave",
            match.id,
            ({ ok, error }: { ok: boolean; error?: string }) => {
                if (!ok) {
                    toast.error(error!);
                }
                goBack();
            },
        );
    };

    const handleSurrender = () => {
        toast("Surrender coming soon", { icon: "🏳️" });
    };

    const handleDraw = () => {
        toast("Draw offer coming soon", { icon: "½" });
    };

    useEffect(() => {
        const join = () => {
            socket.emit(
                "match:join",
                matchId,
                ({ ok, error }: { ok: boolean; error?: string }) => {
                    if (!ok) {
                        toast.error(error!);
                    }
                },
            );
        };

        socket.on("connect", () => join());
        if (socket.connected) join();

        socket.on("match:updated", (updatedMatch) => {
            setMatch(updatedMatch);
            if (updatedMatch.status === "ENDED") {
                toast("The match ended. You will be redirect in the 5 seconds.");
                setTimeout(() => {
                    goBack();
                }, 5000);
            }
        });
        socket.on("user:left-match", () => {
            toast.error("You have left the match. You will be redirect in the 5 seconds.");
            setTimeout(() => {
                goBack();
            }, 5000);
        });

        return () => {
            socket.off("match:updated");
            socket.off("connect");
            socket.off("user:left-match");
        };
    }, [matchId, router]);

    return (
        <div className="-mt-8 h-[calc(100dvh-2rem)] flex flex-col gap-4 sm:gap-5 min-w-0 pb-3">
            {/* 1. Header */}
            <div className="flex justify-center shrink-0">
                <VersusBar
                    hostId={hostPlayer?.userId}
                    you={you}
                    opponent={opponent}
                />
            </div>

            {/* 2. Main Area*/}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-5 sm:gap-6">
                {/* Left: Game Board Arena Card */}
                <GameArena
                    match={match}
                    setMatch={setMatch}
                    user={user}
                    gameId={gameId}
                    engine={engine}
                    MatchView={MatchView}
                    wasMatchStarted={wasMatchStarted}
                    isHost={isHost}
                    opponentPlayer={opponent}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                    onStartMatch={startMatch}
                    onAction={handleAction}
                    onDraw={handleDraw}
                    onSurrender={handleSurrender}
                    onLeaveMatch={handleLeaveMatch}
                />

                {/* Right: Sidebar (Match Info Card -> Banter Box) */}
                {isSidebarOpen && (
                    <aside className="w-full lg:w-80 shrink-0 flex flex-col gap-4 sm:gap-5 min-h-125 lg:min-h-0 animate-in fade-in slide-in-from-right-4 duration-150">
                        <MatchInfoCard match={match} gameId={gameId} />
                        <BanterBoxCard
                            match={match}
                            currentUserName={user?.id || "Player"}
                        />
                    </aside>
                )}
            </div>
        </div>
    );
}
