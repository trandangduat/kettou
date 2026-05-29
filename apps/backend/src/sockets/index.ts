import type { Server } from "socket.io";
import { setupMatchesSocket } from "./matches.socket.js";
import { setupLobbySocket } from "./lobby.socket.js";
import { setupRoomsSocket } from "./rooms.socket.js";

export const setUpSocket = (io: Server) => {
    io.on("connection", (socket) => {
        console.log("socket connected: ", socket.id);

        setupLobbySocket({ io, socket });
        setupRoomsSocket({ io, socket });
        setupMatchesSocket({ io, socket });

        socket.on("disconnect", () => {
            console.log("socket disconnected: ", socket.id);
        });
    });
};
