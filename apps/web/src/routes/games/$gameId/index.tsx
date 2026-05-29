import { socket } from "#/socket";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/games/$gameId/")({
    component: RouteComponent,
});

function RouteComponent() {
    const { gameId } = Route.useParams();
    const [roomsId, setRoomsId] = useState<string[]>([]);
    const router = useRouter();

    const createRoom = async () => {
        socket.emit(
            "create room",
            { gameId },
            async ({ roomId }: { roomId: string }) => {
                if (roomId) {
                    await router.navigate({
                        to: "/rooms/$roomId",
                        params: { roomId },
                    });
                }
            },
        );
    };

    useEffect(() => {
        socket.emit("join rooms update", { gameId });
        socket.on(`rooms snapshot`, ({ roomsId }) => setRoomsId(roomsId));
        socket.on(`room created`, ({ roomId }) => {
            setRoomsId((prevRoomsId: string[]) => [roomId, ...prevRoomsId]);
        });
        socket.on(`room deleted`, ({ roomId }) => {
            setRoomsId((prevRoomsId: string[]) =>
                prevRoomsId.filter((id) => id != roomId),
            );
        });
    }, []);

    return (
        <>
            <h1 className="text-xl">Dice Territory</h1>
            <ul>
                {roomsId.map((roomId: string) => (
                    <li key={roomId}>
                        <Link to="/rooms/$roomId" params={{ roomId: roomId }}>
                            {roomId}
                        </Link>
                    </li>
                ))}
            </ul>
            <button onClick={createRoom}>Create Room</button>
        </>
    );
}
