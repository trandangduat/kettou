import { getAllGames, type Game } from "#/api/games";
import { Button } from "#/components/ui/button";
import { Divider } from "#/components/ui/divider";
import { ArrowRightIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import cn from "cnfast";

export const Route = createFileRoute("/browse/")({
    component: RouteComponent,
});

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { socket } from "#/socket";
import type { MatchStatus, Player } from "@mini-games/core";
import { timeAgo } from "../../../utils";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "#/components/ui/card";
import toast from "react-hot-toast";

type Match = {
    id: string;
    gameId: string;
    players: Player[];
    status: MatchStatus;
    createdAt: number;
};

function RouteComponent() {
    const { data: games, isLoading: isLoadingGames } = useQuery({
        queryKey: ["list-games"],
        queryFn: getAllGames,
    });

    const [selectedGame, setSelectedGame] = useState<Game>();
    const [matches, setMatches] = useState<Match[]>([]);
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
                    toast.error(error);
                }
            },
        );
    };

    useEffect(() => {
        if (currentGame) {
            console.log("current game", currentGame);
            socket.emit("lobby:join", currentGame.id);
        }

        socket.on("lobby:new-match-created", (match: Match) => {
            setMatches((prev) => [...prev, match]);
        });

        socket.on("lobby:match-deleted", (matchId: string) => {
            setMatches((prev) => prev.filter((m) => m.id === matchId));
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

        socket.on("lobby:matches-updated", (matchSummaries: any) => {
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

    return (
        <div className="flex flex-row w-full">
            <div className="flex-2 flex flex-col gap-4 p-4 pr-8">
                <p className="uppercase text-xs tracking-wider">Games</p>
                <div className="flex flex-col gap-4">
                    {!isLoadingGames && games && (
                        <>
                            {games.map((game) => (
                                <GameItem
                                    key={game.id}
                                    game={game}
                                    isActive={currentGame?.id === game.id}
                                    onClick={() => handleSelectGame(game)}
                                />
                            ))}
                        </>
                    )}
                </div>
            </div>
            <div className="flex-8 w-full flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                    <p className="lowercase text-2xl font-semibold tracking-tight">
                        {currentGame?.name}
                    </p>
                    <div>
                        <Button
                            className="font-semibold text-lg"
                            onClick={() => handleCreateMatch(currentGame?.id)}
                        >
                            + create match
                        </Button>
                    </div>
                </div>
                <Divider text="⎛⎝ ≽ > ⩊ < ≼ ⎠⎞" />
                <div className="grid grid-cols-4 gap-8">
                    {matches.map((match) => (
                        <RoomItem match={match} key={match.id} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function GameItem({
    game,
    isActive,
    onClick,
}: {
    game: Game;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <>
            <div
                className={cn(
                    "lowercase flex flex-row justify-between items-center transition cursor-pointer text-shadow-2xs",
                    isActive
                        ? " text-primary"
                        : "text-muted-foreground/67 hover:text-foreground",
                )}
                onClick={onClick}
            >
                <p className="font-semibold text-xl tracking-tight">
                    {game.name}
                </p>
                <span>67</span>
            </div>
        </>
    );
}

function PlayerSlot({ player }: { player?: Player }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <Avatar className="w-14 h-14">
                {player ? (
                    <AvatarImage src="https://github.com/shadcn.png" />
                ) : (
                    <AvatarFallback>?</AvatarFallback>
                )}
            </Avatar>
            {player ? player.username : "empty"}
        </div>
    );
}

function RoomItem({ match }: { match: Match }) {
    const { players } = match;
    return (
        <Card>
            <CardHeader>
                <p className="font-bold">match #{match.id.slice(0, 8)}</p>
            </CardHeader>
            <CardContent>
                <div className="flex flex-row gap-4 justify-center text-xs">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <PlayerSlot
                            key={players?.[i] ? players[i].userId : `empty-slot-${i}`}
                            player={players?.[i]}
                        />
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex flex-row justify-between border-t">
                <span className="text-muted-foreground text-sm flex flex-row gap-1 items-center">
                    <ClockIcon className="size-4" />
                    <p>{timeAgo(match.createdAt)}</p>
                </span>
                <Link
                    to="/$gameId/$matchId"
                    params={{ gameId: match.gameId, matchId: match.id }}
                    className="font-bold flex gap-2 items-center transition hover:text-primary hover:underline"
                >
                    <p>join</p> <ArrowRightIcon className="size-4" />
                </Link>
            </CardFooter>
        </Card>
    );
}
