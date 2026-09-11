import { getAllGamesQueryOptions } from "#/api/games";
import { Button } from "#/components/ui/button";
import { socket } from "#/socket";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import cn from "cnfast";
import { useEffect, useRef, useState } from "react";
import GamesCarousal from "./-components/games-carousal";
import {
    SignInIcon,
    SwordIcon,
    MagnifyingGlassIcon,
    XIcon,
} from "@phosphor-icons/react";
export const Route = createFileRoute("/")({ component: Home });

function Home() {
    const [isInMm, setIsInMm] = useState<boolean>(false);
    const [mmTimer, setMmTimer] = useState<number>(0);
    const [selectedGames, setSelectedGames] = useState<string[]>([]);

    const intervalId = useRef<ReturnType<typeof setInterval>>(null);
    const { data: games, isLoading: isLoadingGames } = useQuery(getAllGamesQueryOptions);
    const router = useRouter();

    const findMatch = () => {
        intervalId.current = setInterval(() => {
            setMmTimer((prev) => prev + 1);
        }, 1000);
        setIsInMm(true);
        socket.emit(
            "matchmaking:join",
            selectedGames,
            ({ ok }: { ok: boolean }) => {
                if (!ok) cancelFindMatch();
            },
        );
    };

    const cancelFindMatch = () => {
        setMmTimer(0);
        setIsInMm(false);
        socket.emit(
            "matchmaking:leave",
            ({ ok, error }: { ok: boolean; error: string }) => {
                if (!ok) {
                    console.error(error);
                }
                if (intervalId.current) {
                    clearInterval(intervalId.current);
                }
            },
        );
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
        // TODO: clean up socket listeners
    }, []);

    return (
        <div className="py-8 flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <div className="flex gap-4 items-center justify-center">
                  <Button
                      className={cn`text-lg lowercase p-6 rounded-full w-50`}
                      variant={"secondary"}
                  >
                      <MagnifyingGlassIcon className="size-6" /> Browse Rooms
                  </Button>
                  <Button
                      className={cn`text-lg lowercase p-6 rounded-full w-50`}
                      variant={"secondary"}
                  >
                      <SignInIcon className="size-6" /> Join
                      Room
                  </Button>
              </div>
                <div className="">
                    {isInMm ? (
                        <CancelFindMatchButton
                            mmTimer={mmTimer}
                            cancelFindMatch={cancelFindMatch}
                        />
                    ) : (
                        <FindMatchButton findMatch={findMatch} />
                    )}
                </div>
            </div>
            <GamesCarousal
                games={games}
                selectedGames={selectedGames}
                setSelectedGames={setSelectedGames}
                isLoadingGames={isLoadingGames}
                isInMm={isInMm}
            />
        </div>
    );
}

function FindMatchButton({ findMatch }: { findMatch: () => void }) {
    return (
        <Button onClick={findMatch} className="font-bold lowercase p-6 w-56">
            <div className="w-full flex items-center justify-between">
                <p className="text-2xl">Find match</p>
                <SwordIcon className="size-6" weight="fill" />
            </div>
        </Button>
    );
}

function CancelFindMatchButton({
    mmTimer,
    cancelFindMatch,
}: {
    mmTimer: number;
    cancelFindMatch: () => void;
}) {
    return (
        <Button
            onClick={cancelFindMatch}
            variant="secondary"
            className="font-bold lowercase p-6 w-56"
        >
            <div className="w-full flex items-center justify-between">
                <p className="text-3xl">{mmTimer}</p>
                <XIcon className="size-6" weight="fill" />
            </div>
        </Button>
    );
}
