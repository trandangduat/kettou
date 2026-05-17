import { getAllRoomsOfGame } from "#/api/rooms";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/games/$gameId/")({
    loader: async ({ context, params }) => {
        return await context.queryClient.ensureQueryData({
            queryKey: ["all-rooms", params.gameId],
            queryFn: () => getAllRoomsOfGame(params.gameId),
        });
    },
    component: RouteComponent,
});

interface Room {
    id: string;
}

function RouteComponent() {
    const { gameId } = Route.useParams();
    const rooms = Route.useLoaderData();
    const queryClient = useQueryClient();
    const router = useRouter();

    const createRoom = async () => {
        await fetch(`/api/games/${gameId}/create-room`, {
            method: "POST",
        });
        queryClient.removeQueries({
            queryKey: ["all-rooms", gameId],
        });
        await router.invalidate();
    };

    return (
        <>
            <h1 className="text-xl">Dice Territory</h1>
            <ul>
                {rooms &&
                    rooms.map((room: Room) => (
                        <li key={room.id}>
                            <Link
                                to="/rooms/$roomId"
                                params={{ roomId: room.id }}
                            >
                                {room.id}
                            </Link>
                        </li>
                    ))}
            </ul>
            <button onClick={createRoom}>Create Room</button>
        </>
    );
}
