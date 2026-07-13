import { createServer } from "http";
import { Server } from "socket.io";
import { BACKEND_PORT, WEB_ORIGIN } from "./config.js";
import { app } from "./app.js";
import { setUpSocket } from "./sockets/index.js";
import { setUpGameEngines } from "./games.js";

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [WEB_ORIGIN],
        credentials: true
    },
});

setUpGameEngines();
setUpSocket(io);

httpServer.listen(BACKEND_PORT, () => {
    console.log(`Server is running on port ${BACKEND_PORT}`);
});
