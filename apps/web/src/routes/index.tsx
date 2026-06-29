import { fetchMe } from "#/api/auth";
import { socket } from "#/socket";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { Match } from "shared";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
    const [isInMm, setIsInMm] = useState<boolean>(false);
    const [mmTimer, setMmTimer] = useState<number>(0);
    const intervalId = useRef<ReturnType<typeof setInterval>>(null);
    const { data: user } = useQuery({
        queryKey: ["me"],
        queryFn: fetchMe,
        retry: false,
    });
    const router = useRouter();

    const findGame = () => {
        intervalId.current = setInterval(() => {
            setMmTimer((prev) => prev + 1);
        }, 1000);
        setIsInMm(true);
        socket.emit(
            "matchmaking:join",
            {
                gameId: "dice-territory",
                user,
            },
            (ok: boolean) => {
                if (!ok) cancelFindGame();
            },
        );
    };

    const cancelFindGame = () => {
        socket.emit(
            "matchmaking:leave",
            {
                gameId: "dice-territory",
                user,
            },
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
        socket.on("matchmaking:found", async ({ match }: { match: Match }) => {
            console.log("Matched Found", match);
            setIsInMm(false);
            await router.navigate({
                to: "/matches/$matchId",
                params: { matchId: match.id },
            });
        });
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-4xl">
                Welcome to <b>DuelHub</b>
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
                            className="flex hover:font-bold"
                        >
                            Find game
                        </button>
                    )}
                    <p
                        className="text-2xl"
                        style={{
                            visibility: isInMm ? "visible" : "hidden",
                        }}
                    >
                        {mmTimer}
                    </p>
                </div>
                <Link to="/games/$gameId" params={{ gameId: "dice-territory" }}>
                    Dice Territory
                </Link>
            </div>
        </div>
    );
}
