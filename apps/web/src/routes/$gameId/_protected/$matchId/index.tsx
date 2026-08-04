import { socket } from "#/socket";
import { createFileRoute, useCanGoBack, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameRegistry, type Match, type Player } from "@mini-games/core";
import { GameUI } from "#/games";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "#/components/ui/card";
import { Avatar, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { timeAgo } from "../../../../../utils";
import {
    ArrowPathIcon,
    ChatBubbleLeftRightIcon,
    ClockIcon,
    Cog6ToothIcon,
    HashtagIcon,
    Squares2X2Icon,
    PlayIcon,
    ChevronLeftIcon,
} from "@heroicons/react/24/solid";
import React from "react";
import { ArrowLeftCircleIcon, FlagIcon } from "@heroicons/react/24/outline";
import { Input } from "#/components/ui/input";
import { Field } from "#/components/ui/field";
import cn from "cnfast";
import toast from "react-hot-toast";

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

    let you = match?.players[0];
    let opponent = match?.players[1];
    [you, opponent] =
        you?.userId === user?.id ? [you, opponent] : [opponent, you];
    let isHost = user.id === match?.players[0]?.userId;
    let wasMatchStarted =
        match?.status !== "WAITING" && match?.status !== "READY";

    const MatchView = GameUI[gameId];

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
        });

        return () => {
            socket.off("match:updated");
            socket.off("connect");
        };
    }, []);

    return (
        <div className="h-[calc(100dvh-6.5rem)] flex flex-col">
            <div className="flex-1 min-h-0 flex flex-row gap-8 pb-10">
                <div className="flex-75 min-h-0">
                    <Card className="h-full">
                        <CardHeader>
                            <OpponentInfo player={opponent} />
                        </CardHeader>
                        <CardContent className="border-y bg-background h-full p-4 flex items-center relative">
                            {!wasMatchStarted && (
                                <>
                                    {isHost ? (
                                        <Button
                                            className="flex items-center gap-2 text-lg font-bold absolute"
                                            onClick={startMatch}
                                        >
                                            <PlayIcon className="h-6 w-6" />
                                            start match
                                        </Button>
                                    ) : (
                                        <p>Wait for host to start game...</p>
                                    )}
                                </>
                            )}

                            <div className="flex flex-col items-center h-full w-full">
                                <MatchView
                                    match={match}
                                    setMatch={setMatch}
                                    user={user}
                                    engine={engine}
                                    handleAction={handleAction}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <YourInfo player={you} />
                        </CardFooter>
                    </Card>
                </div>
                <Sidebar className="flex-25 min-h-0" match={match} />
            </div>
        </div>
    );
}

function OpponentInfo({ player }: { player?: Player }) {
    return (
        <div className="flex flex-row justify-end w-full">
            <div className="flex flex-row gap-4 items-center">
                <div className="flex flex-col items-end">
                    <p className="font-semibold text-lg">
                        {player ? player.username : "waiting for player..."}
                    </p>
                    {player && (
                        <span className="flex flex-row text-sm items-center">
                            <p className="">{player.elo}</p>
                        </span>
                    )}
                </div>
                <Avatar className="border-2 border-primary w-14 h-14">
                    <AvatarImage src="https://github.com/shadcn.png"></AvatarImage>
                </Avatar>
            </div>
        </div>
    );
}

function YourInfo({ player }: { player?: Player }) {
    return (
        <div className="flex flex-row justify-between w-full items-center">
            <div className="flex flex-row gap-4 items-center">
                <Avatar className="border-2 border-primary w-14 h-14">
                    <AvatarImage src="https://github.com/shadcn.png"></AvatarImage>
                </Avatar>
                <div className="flex flex-col">
                    <p className="font-semibold text-lg">
                        {player ? player.username : "waiting for player..."}
                    </p>
                    {player?.elo && (
                        <span className="flex flex-row text-sm items-center">
                            <p className="">{player.elo}</p>
                        </span>
                    )}
                </div>
            </div>
            <div className="flex flex-row gap-2">
                <Button
                    variant="secondary"
                    className="flex items-center gap-2 p-5"
                >
                    <FlagIcon className="h-4 w-4" />
                    surrender
                </Button>

                <Button
                    variant="secondary"
                    className="flex items-center gap-2 p-5 shadow-sm"
                >
                    <span className="flex h-4 w-4 items-center justify-center font-mono text-[20px] font-medium leading-none">
                        &frac12;
                    </span>
                    draw
                </Button>
            </div>
        </div>
    );
}

function Sidebar({
    className,
    match,
}: {
    className?: string;
    match: Match<any>;
}) {
    const router = useRouter();
    const canGoBack = useCanGoBack();

    const handleLeaveMatch = () => {
        if (canGoBack) {
            router.history.back();
        } else {
            router.navigate({ to: "/" });
        }
        socket.emit(
            "match:leave",
            match.id,
            ({ ok, error }: { ok: boolean; error?: string }) => {
                if (!ok) {
                    toast.error(error!);
                }
            },
        );
    };

    return (
        <div className={cn("flex flex-col gap-8", className)}>
            <Button
                variant="destructive"
                className="flex flex-row gap-2 font-bold lowercase text-lg py-6"
                onClick={handleLeaveMatch}
            >
                <ArrowLeftCircleIcon className="size-6" />
                Leave match
            </Button>
            <SidebarCard title="match information">
                <CardContent className="flex flex-col gap-2">
                    <InfoItem
                        label="id"
                        content={match.id.slice(0, 8)}
                        icon={HashtagIcon}
                    />
                    <InfoItem
                        label="mode"
                        content={match.type}
                        icon={Cog6ToothIcon}
                    />
                    <InfoItem
                        label="status"
                        content={match.status}
                        icon={ArrowPathIcon}
                    />
                    <InfoItem
                        label="game"
                        content={match.gameId}
                        icon={Squares2X2Icon}
                    />
                    <InfoItem
                        label="created"
                        content={timeAgo(match.createdAt)}
                        icon={ClockIcon}
                    />
                </CardContent>
            </SidebarCard>
            <SidebarCard className="flex flex-col min-h-0" title="banter box">
                <CardContent className="border-b h-full">hello hi</CardContent>
                <CardFooter>
                    <Field orientation="horizontal">
                        <Input placeholder="type here..." />
                        <Button>send</Button>
                    </Field>
                </CardFooter>
            </SidebarCard>
        </div>
    );
}

function InfoItem({
    label,
    content,
    icon: Icon,
}: {
    label: string;
    content: string;
    icon?: React.ElementType;
}) {
    return (
        <div className="flex flex-row justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
                {Icon && <Icon className="size-4" />}
                <p>{label}</p>
            </span>
            <p className="lowercase font-semibold">{content}</p>
        </div>
    );
}

function SidebarCard({
    title,
    className,
    children,
}: {
    title: string;
    className?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className={className}>
            <span className="text-primary text-lg font-semibold mb-2 flex gap-2 items-center">
                <ChatBubbleLeftRightIcon className="size-8" />
                <p>{title}</p>
            </span>
            <Card className="flex-1 min-h-0">{children}</Card>
        </div>
    );
}
