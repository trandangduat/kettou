import { getAllGamesQueryOptions, type Game } from "#/api/games";
import { Divider } from "#/components/ui/divider";
import { socket } from "#/socket";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
    BrowseHeader,
    GamesSidebar,
    RoomGrid,
    type Match,
} from "./-components";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/browse/")({
    component: RouteComponent,
});

function RouteComponent() {
    const { data: games, isLoading: isLoadingGames } = useQuery(
        getAllGamesQueryOptions,
    );

    const [selectedGame, setSelectedGame] = useState<Game>();
    const [matches, setMatches] = useState<Match[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [createMatchError, setCreateMatchError] = useState<
        string | undefined
    >(undefined);
    const currentGame = selectedGame ?? games?.[0];
    const router = useRouter();

    const handleSelectGame = async (game: Game) => {
        setSelectedGame(game);
        if (currentGame) {
            setMatches([]);
            socket.emit("lobby:leave", currentGame.id);
        }
        socket.emit("lobby:join", game.id);
    };

    const handleCreateMatch = async (gameId: string | undefined) => {
        if (!gameId) return;
        socket.off("lobby:new-match-created");
        socket.emit(
            "match:create",
            { gameId, matchType: "CUSTOM" },
            ({
                ok,
                error,
                matchId,
            }: {
                ok: boolean;
                error: string;
                matchId: string;
            }) => {
                if (ok) {
                    toast.success("Created match successfully!");
                    router.navigate({
                        to: "/$gameId/$matchId",
                        params: {
                            gameId,
                            matchId,
                        },
                    });
                } else {
                    setCreateMatchError(error);
                    setOpen(true);
                }
            },
        );
    };

    useEffect(() => {
        if (currentGame) {
            socket.emit("lobby:join", currentGame.id);
        }

        socket.on("lobby:new-match-created", (match: Match) => {
            setMatches((prev) => [...prev, match]);
        });

        socket.on("lobby:match-deleted", (matchId: string) => {
            setMatches((prev) => prev.filter((m) => m.id !== matchId));
        });

        socket.on("lobby:match-updated", (match: Match) => {
            setMatches((prev) => {
                let newMatches = [...prev];
                let id = newMatches.findIndex((m) => m.id === match.id);
                if (id != -1) {
                    newMatches[id] = { ...match };
                }
                return newMatches;
            });
        });

        socket.on("lobby:matches-updated", (matchSummaries: Match[]) => {
            setMatches(matchSummaries);
        });

        return () => {
            socket.off("lobby:new-match-created");
            socket.off("lobby:match-deleted");
            socket.off("lobby:match-updated");
            socket.off("lobby:matches-updated");
        };
    }, [currentGame]);

    if (isLoadingGames) {
        return null;
    }

    const filteredMatches = matches.filter((m) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const idMatches = m.id.toLowerCase().includes(q);
        const playerMatches = m.players?.some((p) =>
            p?.userId?.toLowerCase().includes(q),
        );
        return idMatches || playerMatches;
    });

    return (
        <div className="flex flex-row gap-8 w-full min-h-[calc(100dvh-4rem)]">
            <GamesSidebar
                games={games}
                selectedGameId={currentGame?.id}
                onSelectGame={handleSelectGame}
            />

            <Divider orientation="vertical" className="self-stretch" />

            <main className="flex-1 flex flex-col gap-6 min-w-0">
                <BrowseHeader
                    gameName={currentGame?.name}
                    roomCount={matches.length}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onCreateMatch={() => handleCreateMatch(currentGame?.id)}
                />
                <RoomGrid
                    matches={filteredMatches}
                    searchQuery={searchQuery}
                    gameId={currentGame?.id}
                />
            </main>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unable to create match</DialogTitle>
                        <DialogDescription>
                            {createMatchError}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose
                            render={<Button size="lg">Ok</Button>}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
