import { getAllGamesQueryOptions } from "#/api/games";
import { Button } from "#/components/ui/button";
import { socket } from "#/socket";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import GamesCarousal from "./-components/games-carousal";
import CardDurakImg from "#/assets/card-durak.png";
import DiceTerritoryImg from "#/assets/dice-territory.png";
import {
    SignInIcon,
    SwordIcon,
    MagnifyingGlassIcon,
    XIcon,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
} from "#/components/ui/dialog";

export const Route = createFileRoute("/")({ component: Home });

const MATCHMAKING_FOUND_WAIT = 3;

const GAME_IMAGES: Record<string, string> = {
    "dice-territory": DiceTerritoryImg,
    "card-durak": CardDurakImg,
};

function Home() {
    const [isInMm, setIsInMm] = useState<boolean>(false);
    const [mmTimer, setMmTimer] = useState<number>(0);
    const [selectedGames, setSelectedGames] = useState<string[]>([]);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [dialogContent, setDialogContent] = useState<number>(-1);
    const [foundGameId, setFoundGameId] = useState<string | null>(null);

    const intervalId = useRef<ReturnType<typeof setInterval>>(null);
    const { data: games, isLoading: isLoadingGames } = useQuery(getAllGamesQueryOptions);
    const router = useRouter();

    const findMatch = () => {
        socket.emit(
            "matchmaking:join",
            selectedGames,
            ({ ok, error }: { ok: boolean, error?: string }) => {
                if (!ok && error) {
                    toast.error(error);
                } else {
                    intervalId.current = setInterval(() => {
                        setMmTimer((prev) => prev + 1);
                    }, 1000);
                    setIsInMm(true);
                }
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
                setIsInMm(false);
                setFoundGameId(gameId);
                setDialogOpen(true);
                setDialogContent(MATCHMAKING_FOUND_WAIT);
                const waitUntil = Date.now() + MATCHMAKING_FOUND_WAIT * 1000;

                const intv = setInterval(async () => {
                    console.log("WAIT UNTIL: ", new Date(waitUntil))

                    if (Date.now() >= waitUntil) {
                        await router.navigate({
                            to: "/$gameId/$matchId",
                            params: { gameId, matchId },
                        })
                        clearInterval(intv);
                    }

                    let counter = Math.ceil((waitUntil - Date.now()) / 1000);
                    if (counter < 0) {
                        counter = 0;
                    }
                    setDialogContent(counter);
                }, 1000);
            },
        );
        return () => {
            socket.off("matchmaking:found");
        }
    }, []);

    const foundGame = games?.find((game: any) => game.id === foundGameId);

    return (
        <div className="py-8 flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center justify-center">
                    <Button
                        size="2xl"
                        className="w-56"
                        variant="secondary"
                    >
                        <MagnifyingGlassIcon className="size-5" />
                        <span>Browse Rooms</span>
                    </Button>
                    <Button
                        size="2xl"
                        className="w-56"
                        variant="secondary"
                    >
                        <SignInIcon className="size-5" />
                        <span>Join Room</span>
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
            <Dialog open={dialogOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="w-sm flex flex-col justify-center"
                >
                    <div className="flex flex-col gap-6">
                        <DialogHeader>
                            <div className="flex justify-center uppercase">Match Found</div>
                        <div className="flex justify-center">
                            {foundGame && (
                                <div className="inline-flex items-center justify-center pr-4">
                                    {GAME_IMAGES[foundGame.id] && (
                                        <img
                                            src={GAME_IMAGES[foundGame.id]}
                                            alt={foundGame.name}
                                            className="size-12 object-contain"
                                        />
                                    )}
                                    <p className="text-lg tracking-tight font-semibold lowercase text-primary">
                                        {foundGame.name}
                                    </p>
                                </div>
                            )}
                        </div>
                        </DialogHeader>
                        <div className="flex justify-center font-space-grotesk">
                            <span className="text-8xl">
                                {dialogContent}
                            </span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
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
        <Button
            onClick={findMatch}
            size="2xl"
            className="w-56 justify-between px-6"
        >
            <span>Find match</span>
            <SwordIcon className="size-6" weight="fill" />
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
            size="2xl"
            className="w-56 justify-between px-6"
        >
            <span>{mmTimer}</span>
            <XIcon className="size-6" weight="fill" />
        </Button>
    );
}
