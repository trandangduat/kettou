import { getAllGames } from "#/api/games";
import { Button } from "#/components/ui/button";
import { socket } from "#/socket";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import cn from "cnfast";
import { useEffect, useRef, useState } from "react";
import GamesCarousal from "./-components/games-carousal";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
    const [isInMm, setIsInMm] = useState<boolean>(false);
    const [mmTimer, setMmTimer] = useState<number>(0);
    const [selectedGames, setSelectedGames] = useState<string[]>([]);
    const [currentMatch, setCurrentMatch] = useState<{
        gameId: string;
        matchId: string;
    } | null>(null);

    const intervalId = useRef<ReturnType<typeof setInterval>>(null);
    const { data: games, isLoading: isLoadingGames } = useQuery({
        queryKey: ["list-games"],
        queryFn: getAllGames,
    });
    const router = useRouter();

    const findGame = () => {
        intervalId.current = setInterval(() => {
            setMmTimer((prev) => prev + 1);
        }, 1000);
        setIsInMm(true);
        socket.emit(
            "matchmaking:join",
            selectedGames,
            ({ ok }: { ok: boolean }) => {
                if (!ok) cancelFindGame();
            },
        );
    };

    const cancelFindGame = () => {
        socket.emit("matchmaking:leave", ({ ok }: { ok: boolean }) => {
            if (!ok) return;
            setMmTimer(0);
            if (intervalId.current) {
                clearInterval(intervalId.current);
            }
            setIsInMm(false);
        });
    };

    useEffect(() => {
        socket.on(
            "matchmaking:found",
            async (matchId: string, gameId: string) => {
                console.log("Matched Found");
                setIsInMm(false);
                await router.navigate({
                    to: "/$gameId/$matchId",
                    params: { gameId, matchId },
                });
            },
        );

        socket.on(
            "current-match-updated",
            (gameId: string, matchId: string) => {
                console.log("$$$$$$$$$current-match-updated", gameId, matchId);
                setCurrentMatch({
                    gameId: gameId,
                    matchId: matchId,
                });
            },
        );

        // TODO: clean up socket listeners
    }, []);

    return (
        <div className="p-8">
            <GamesCarousal
                games={games}
                selectedGames={selectedGames}
                setSelectedGames={setSelectedGames}
                isLoadingGames={isLoadingGames}
            />
            {isInMm ? (
                <Button onClick={cancelFindGame} variant="outline">
                    {mmTimer} x
                </Button>
            ) : (
                <Button onClick={findGame}>Find game</Button>
            )}
            {currentMatch && (
                <div className="bg-yellow-200">
                    You are currently in a match:{" "}
                    <Link
                        className="text-blue-500 hover:underline"
                        to={`/$gameId/$matchId`}
                        params={{
                            gameId: currentMatch.gameId,
                            matchId: currentMatch.matchId,
                        }}
                    >
                        {currentMatch.matchId}
                    </Link>
                </div>
            )}
        </div>
    );
}
