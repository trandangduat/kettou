import type { Server, Socket } from "socket.io";

export type SocketHandlerContext = {
    io: Server;
    socket: Socket;
};
