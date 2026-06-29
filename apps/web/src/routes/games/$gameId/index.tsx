import { socket } from "#/socket";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/games/$gameId/")({
    component: RouteComponent,
});

function RouteComponent() {
    const { gameId } = Route.useParams();
    const [matchIds, setMatchIds] = useState<string[]>([]);
    const router = useRouter();

    const createMatch = async () => {
        socket.emit(
            "match:create",
            { gameId, matchType: "CUSTOM" },
            async ({ matchId }: { matchId: string }) => {
                if (matchId) {
                    await router.navigate({
                        to: "/matches/$matchId",
                        params: { matchId },
                    });
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
        <>
            <h1 className="text-xl">Dice Territory</h1>
            <ul>
                {matchIds.map((id: string) => (
                    <li key={id}>
                        <Link to="/matches/$matchId" params={{ matchId: id }}>
                            {id}
                        </Link>
                    </li>
                ))}
            </ul>
            <button onClick={createMatch}>+ New Match</button>
        </>
    );
}
