import { getGameById } from "#/api/games";
import { socket } from "#/socket";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/$gameId/")({
    component: RouteComponent,
});

function RouteComponent() {
    const { gameId } = Route.useParams();
    const [matchIds, setMatchIds] = useState<string[]>([]);
    const router = useRouter();
    const { data: game, isLoading: isLoadingGame } = useQuery({
        queryKey: ["get-game", gameId],
        queryFn: () => getGameById(gameId),
    });

    const createMatch = async () => {
        socket.emit(
            "match:create",
            { gameId, matchType: "CUSTOM" },
            async ({
                ok,
                matchId,
                error,
            }: {
                ok: boolean;
                matchId: string;
                error: string;
            }) => {
                if (ok) {
                    await router.navigate({
                        to: "/$gameId/$matchId",
                        params: { gameId, matchId },
                    });
                } else {
                    console.log(error);
                }
            },
        );
    };

    useEffect(() => {
        socket.emit("lobby:matches-update", { gameId });
        socket.on("lobby:matches-update", ({ matchIds }) =>
            setMatchIds(matchIds),
        );
        socket.on("match:created", ({ matchId }) => {
            setMatchIds((prevMatchesId: string[]) => [
                matchId,
                ...prevMatchesId,
            ]);
        });
        socket.on("match:deleted", ({ matchId }) => {
            setMatchIds((prevMatchIds: string[]) =>
                prevMatchIds.filter((id) => id != matchId),
            );
        });
    }, []);

    return (
        <div>
            {isLoadingGame ? (
                <p>Loading game information...</p>
            ) : (
                <>
                    <h1 className="text-xl">{game.name}</h1>
                    <ul>
                        {matchIds.map((id: string) => (
                            <li key={id}>
                                <Link
                                    to="/$gameId/$matchId"
                                    params={{ gameId, matchId: id }}
                                >
                                    {id}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <button onClick={createMatch}>+ New Match</button>
                </>
            )}
        </div>
    );
}
