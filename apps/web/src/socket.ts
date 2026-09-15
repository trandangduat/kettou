import { io } from "socket.io-client";

export const socket = io({
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
    timeout: 5000
});

socket.on("connect_error", (err) => {
    console.error("Socket connect_error:", err.message);
});

export const connectSocket = () => {
    if (socket.disconnected) {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};
