import { io } from "socket.io-client";

const socket = io(window.location.origin, {
  transports: ["websocket", "polling"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
});

socket.on("connect_error", (err) => {
  console.warn("Socket connection error:", err.message);
});

socket.on("connect", () => {
  console.log("Socket connected successfully");
});

export default socket;
