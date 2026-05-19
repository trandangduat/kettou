import { getAllRoomsOfGame } from "#/api/rooms";
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
    const router = useRouter();

    const createRoom = async () => {
        const res = await fetch(`/api/games/${gameId}/create-room`, {
            method: "POST",
        });
        const { roomId } = await res.json();
        await router.navigate({ to: "/rooms/$roomId", params: { roomId } });
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
