import { getRoom } from "#/api/rooms";
import { socket } from "#/socket";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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

interface GameMove {
    r: Number;
    c: Number;
    d: Number;
}

interface PlayerState {
    username: String;
    id: String;
    moves: GameMove[];
}

interface GameState {
    player1: PlayerState | null;
    player2: PlayerState | null;
    canStart: Boolean;
    isPlaying: Boolean;
    turn: String;
}

function RouteComponent() {
    const room = Route.useLoaderData();
    const { user } = Route.useRouteContext();
    const [gameState, setGameState] = useState<GameState>();

    const startGame = () => {
        socket.emit("start game", {
            roomId: room.id,
            userId: user.userId,
        });
    };

    useEffect(() => {
        socket.emit("join room", {
            roomId: room.id,
            user: {
                username: user.username,
                id: user.userId,
            },
        });

        socket.on("update gamestate", (newState) => {
            setGameState(newState);
        });

        return () => {
            socket.emit("leave room", {
                roomId: room.id,
                user: {
                    username: user.username,
                    id: user.userId,
                },
            });
        };
    }, []);
    return (
        <>
            <h1>{room.id}</h1>
            <p>{room.game_id}</p>
            <p>
                Player 1:
                {gameState && gameState.player1
                    ? gameState.player1.username
                    : "NULL"}
            </p>
            <p>
                Player 2:
                {gameState && gameState.player2
                    ? gameState.player2.username
                    : "NULL"}
            </p>
            <button
                onClick={startGame}
                className="p-2 border"
                style={{
                    backgroundColor:
                        gameState?.canStart &&
                        gameState?.player1?.id == user.userId
                            ? "cyan"
                            : "grey",
                }}
            >
                Start Game
            </button>
            <p>isPlaying: {gameState?.isPlaying ? "true" : "false"}</p>
            <GameBoard />
        </>
    );
}
