import { getAllGamesQueryOptions } from "#/api/games";
import { Button } from "#/components/ui/button";
import { socket } from "#/socket";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import GamesCarousal from "./-components/games-carousal";
import {
    SignInIcon,
    SwordIcon,
    MagnifyingGlassIcon,
    XIcon,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "#/components/ui/dialog";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
    const [isInMm, setIsInMm] = useState<boolean>(false);
    const [mmTimer, setMmTimer] = useState<number>(0);
    const [selectedGames, setSelectedGames] = useState<string[]>([]);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const [dialogContent, setDialogContent] = useState<string>("");

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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unable to create match</DialogTitle>
                        <DialogDescription>
                            {dialogContent}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose
                            render={<Button size="lg">Ok</Button>}
                        />
                    </DialogFooter>
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
