import { fetchMe } from "#/api/auth";
import { getAllGames } from "#/api/games";
import { socket } from "#/socket";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
    const [isInMm, setIsInMm] = useState<boolean>(false);
    const [mmTimer, setMmTimer] = useState<number>(0);
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
            "dice-territory",
            (ok: boolean) => {
                if (!ok) cancelFindGame();
            },
        );
    };

    const cancelFindGame = () => {
        socket.emit(
            "matchmaking:leave",
            "dice-territory",
            (ok: boolean) => {
                if (!ok) return;
                setMmTimer(0);
                if (intervalId.current) {
                    clearInterval(intervalId.current);
                }
                setIsInMm(false);
            },
        );
    };

    useEffect(() => {
        socket.on("matchmaking:found", async (matchId: string) => {
            console.log("Matched Found");
            setIsInMm(false);
            await router.navigate({
                to: "/$gameId/$matchId",
                params: { gameId: "dice-territory", matchId },
            });
        });
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-4xl">
                Welcome to <b>Kettou</b>
            </h1>
            <div className="flex flex-col">
                <div className="flex gap-2 items-center">
                    {isInMm ? (
                        <button
                            onClick={cancelFindGame}
                            className="flex hover:font-bold"
                        >
                            Cancel
                        </button>
                    ) : (
                        <button
                            onClick={findGame}
                            className="flex hover:bg-amber-200 p-2 border font-bold"
                        >
                            Find game
                        </button>
                    )}
                    <p
                        className="text-2xl"
                        style={{ visibility: isInMm ? "visible" : "hidden" }}
                    >
                        {mmTimer}
                    </p>
                </div>
                <p>List of games:</p>
                {isLoadingGames ? (
                    <p>Loading games...</p>
                ) : (
                    <ul className="list-disc">
                        {games.map((game: any) => (
                            <li key={game.id} className="hover:font-bold">
                                <Link
                                    to="/$gameId"
                                    params={{ gameId: game.id }}
                                >
                                    {game.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
