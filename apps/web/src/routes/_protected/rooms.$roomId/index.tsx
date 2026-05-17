import { getRoom } from "#/api/rooms";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/rooms/$roomId/")({
    loader: async ({ context, params }) => {
        const roomId = params.roomId;
        const room = await context.queryClient.ensureQueryData({
            queryKey: ["room", roomId],
            queryFn: () => getRoom(roomId),
        });
        console.log("Room", room);
        return room;
    },
    component: RouteComponent,
});

function RouteComponent() {
    const room = Route.useLoaderData();
    return (
        <>
            <h1>{room.id}</h1>
            <p>{room.game_id}</p>
        </>
    );
}
