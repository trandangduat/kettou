import { socket } from "#/socket";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameRegistry, type Match } from "@mini-games/core";
import { GameUI } from "#/games";
import cn from "cnfast";

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

    const { status, players } = match;
    const MatchView = GameUI[gameId];

    let matchStatusColor: string = "";
    switch (status) {
        case "WAITING":
            matchStatusColor = "text-yellow-500";
            break;
        case "READY":
            matchStatusColor = "text-blue-500";
            break;
        case "PLAYING":
            matchStatusColor = "text-green-500";
            break;
        case "ENDED":
            matchStatusColor = "text-red-500";
            break;
        default:
            break;
    }

    const startMatch = () => {
        socket.emit(
            "match:start",
            matchId,
            ({ ok, error }: { ok: boolean; error?: string }) => {
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
        const join = () => {
          socket.emit(
              "match:join",
              matchId,
              ({ ok, error }: { ok: boolean; error?: string }) => {
                  if (!ok) console.error(error);
              },
          );
        }

        socket.on("connect", () => join());
        if (socket.connected) join();

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
                        {i >= players.length ? (
                            <b className="text-gray-500">-</b>
                        ) : (
                            <>
                                {players[i].username}
                                <b
                                    className={cn(
                                        players[i].status === "ONLINE"
                                            ? "text-green-500"
                                            : "text-red-500",
                                    )}
                                >
                                    ({players[i].status})
                                </b>
                            </>
                        )}
                    </div>
                );
            })}
            <div className="flex flex-row">
                <button
                    onClick={startMatch}
                    className="p-2 border"
                    disabled={
                        status !== "READY" || user.id !== players[0].userId
                    }
                    style={{
                        backgroundColor:
                            status === "READY" && user.id === players[0].userId
                                ? "cyan"
                                : "grey",
                    }}
                >
                    Start Game
                </button>
            </div>
            <p>
                Match Status:
                <b className={matchStatusColor}>{match.status}</b>
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
