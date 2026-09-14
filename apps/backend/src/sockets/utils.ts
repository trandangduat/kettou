export const getUserRoom = (userId: string) => `user:${userId}`;
export const getLobbyRoom = (gameId: string) => `lobby:${gameId}`;
// this room contains all user's clients in the match
export const getMatchUserRoom = (matchId: string, userId: string) => `match:${matchId}:user:${userId}`;

export const handleEvent = (handlerFunc: any) => {
    return async (...args: any[]) => {
        const lastArg = args.pop();
        if (typeof lastArg === "function") {
            const ack = lastArg;
            try {
                const res = await handlerFunc(...args);
                ack({ ok: true, ...(res || {}) });
            } catch (err) {
                console.error(err);
                ack({ ok: false, error: String(err) });
            }
        } else {
            try {
                args.push(lastArg);
                await handlerFunc(...args);
            } catch (err) {
                console.error(err);
            }
        }
    };
};

export const debugRooms = (io: any) => {
    const rooms = io.sockets.adapter.rooms;
    const sids = io.sockets.adapter.sids;
    const activeRooms = Array.from(rooms.entries()).filter(
        (r) => !sids.has(r[0]),
    );
    console.log("👉 Current socket rooms:", activeRooms);
};
