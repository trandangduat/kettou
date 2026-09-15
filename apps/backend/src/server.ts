import { createServer } from "http";
import { Server } from "socket.io";
import { ALLOWED_CLIENT_ORIGINS, BACKEND_PORT } from "./config.js";
import { app } from "./app.js";
import { setUpSocket } from "./sockets/index.js";
import { setUpGameEngines } from "./games.js";

const httpServer = createServer(app);
const io = new Server(httpServer, {
    pingInterval: 5000,
    pingTimeout: 3000,
    cors: {
        origin: ALLOWED_CLIENT_ORIGINS,
        credentials: true
    },
});

setUpGameEngines();
setUpSocket(io);

httpServer.listen(BACKEND_PORT, () => {
    console.log(`Server is running on port ${BACKEND_PORT}`);
});
