import { getRoom } from "#/api/rooms";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/rooms/$roomId/")({
    loader: async ({ context, params }) => {
        const roomId = params.roomId;
        const room = await context.queryClient.ensureQueryData({
            queryKey: ["room", roomId],
            queryFn: () => getRoom(roomId),
        });
        return room;
    },
    component: RouteComponent,
});

function GameBoard() {
    const W = 20;
    const H = 30;
    const gameState = {
        player1: [
            { r: 1, c: 1, d: 3 },
            { r: 2, c: 4, d: 2 },
        ],
        player2: [{ r: 1, c: 2, d: 5 }],
    };
    const blueCells: number[][] = [];
    const redCells: number[][] = [];
    for (const play of gameState.player1) {
        let { r, c, d: len } = play;
        for (let i = r; i <= r + len - 1; i++) {
            for (let j = c; j <= c + len - 1; j++) {
                blueCells.push([i, j]);
            }
        }
    }
    for (const play of gameState.player2) {
        let { r, c, d: len } = play;
        r = H - r + 1;
        c = W - c + 1;
        for (let i = r; i >= r - len + 1; i--) {
            for (let j = c; j >= c - len + 1; j--) {
                redCells.push([i, j]);
            }
        }
    }
    return (
        <div
            className="w-100 h-150 gap-px"
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${W}, 1fr)`,
                gridTemplateRows: `repeat(${H}, 1fr)`,
            }}
        >
            {Array.from({ length: W * H }, (_, i) => {
                const r = H - Math.floor(i / W);
                const c = (i % W) + 1;
                const isBlue =
                    blueCells.findIndex((e) => e[0] == r && e[1] == c) != -1;
                const isRed =
                    redCells.findIndex((e) => e[0] == r && e[1] == c) != -1;
                return (
                    <div
                        key={`cell-${r}-${c}`}
                        className="outline-1"
                        style={{
                            backgroundColor: isBlue
                                ? "blue"
                                : isRed
                                  ? "red"
                                  : "white",
                        }}
                    ></div>
                );
            })}
        </div>
    );
}

function RouteComponent() {
    const room = Route.useLoaderData();
    return (
        <>
            <h1>{room.id}</h1>
            <p>{room.game_id}</p>
            <p>Player 1: {room.player1_id}</p>
            <p>Player 2: {room.player2_id ?? "NULL"}</p>
            <GameBoard />
        </>
    );
}
