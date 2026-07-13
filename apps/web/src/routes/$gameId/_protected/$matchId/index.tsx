import { socket } from "#/socket";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameRegistry, type Match } from "@mini-games/core";
import { GameUI } from "#/games";

export const Route = createFileRoute("/$gameId/_protected/$matchId/")({
    component: RouteComponent,
});

function RouteComponent() {
    const { gameId, matchId } = Route.useParams();
    const { user } = Route.useRouteContext();
    const engine = GameRegistry.getEngine(gameId);

    const [waitingStart, setWaitingStart] = useState<boolean>(false);
    const [match, setMatch] = useState<Match<any>>(
        engine.createNewMatchState("CUSTOM"),
    );

    const { status, players } = match;
    const MatchView = GameUI[gameId];

    const startMatch = () => {
        setWaitingStart(true);
        socket.emit(
            "match:action",
            {
                matchId,
                action: {
                    type: "START_MATCH",
                    userId: user.id,
                },
            },
            ({ ok, error }: { ok: boolean; error?: string }) => {
                setWaitingStart(false);
                if (!ok) {
                    console.error(error);
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
                if (!ok) console.error(error);
            },
        );
    };

    useEffect(() => {
        socket.emit(
            "match:join",
            matchId,
            ({ ok, error }: { ok: boolean; error?: string }) => {
                if (!ok) console.error(error);
            },
        );
        socket.on("match:updated", (updatedMatch) => {
            setMatch(updatedMatch);
        });

        return () => {
            socket.emit(
                "match:leave",
                matchId,
                ({ ok, error }: { ok: boolean; error?: string }) => {
                    if (!ok) console.log(error);
                },
            );
        };
    }, []);

    return (
        <>
            <p>{matchId}</p>
            <p>{match.gameId}</p>
            {Array.from({ length: 2 }).map((_, i) => {
                return (
                    <div key={i}>
                        Player {i + 1}:{" "}
                        {i + 1 > players.length ? "-" : players[i].username}
                    </div>
                );
            })}
            <div className="flex flex-row">
                <button
                    onClick={startMatch}
                    className="p-2 border"
                    style={{
                        backgroundColor:
                            status === "READY" && user.id === players[0].userId
                                ? "cyan"
                                : "grey",
                    }}
                >
                    Start Game
                </button>
                {waitingStart && "Waiting game to start..."}
            </div>
            <p>
                isPlaying:
                <b
                    style={{
                        color: status === "PLAYING" ? "green" : "red",
                    }}
                >
                    {status === "PLAYING" ? "true" : "false"}
                </b>
            </p>
            <MatchView
                match={match}
                setMatch={setMatch}
                user={user}
                engine={engine}
                handleAction={handleAction}
            />
        </>
    );
}
