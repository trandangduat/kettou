import { io } from "socket.io-client";
export const socket = io("http://localhost:3000", {
    withCredentials: true,
    autoConnect: false
});

socket.on("connect_error", (err) => {
    console.error(err.message);
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
