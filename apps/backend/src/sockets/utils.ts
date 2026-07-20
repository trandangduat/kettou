export const getUserRoomKey = (userId: string) => `user:${userId}`;
export const getLobbyRoomKey = (gameId: string) => `lobby:${gameId}`;

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
