import type { SocketClient } from "$lib/socket.types";
import { io } from "socket.io-client";
import { CSRF_HEADER, LOCAL_DISMISSED_EXPIRATION_WARNING, WEBSOCKET_PATH } from "../../constants";
import { showSessionExpirationWarning } from "./stores";

export const socketClientSetup = (
  origin: string,
  csrfToken: string,
  socketUIserName?: string
): SocketClient => {
  const socket = io(origin, {
    path: WEBSOCKET_PATH,
    extraHeaders: { [CSRF_HEADER]: csrfToken }
  }).connect() as SocketClient;
  socket.on("connect", () => {
    console.log("Chat socket Connected");
  });
  socket.on("basicEmit", (val) => {
    console.log("Received:", val);
  });
  socket.on("participantOnline", (username, online) => {
    if (username === socketUIserName) return;
    console.log(`${username} ${online ? "is online" : "is offline"}`);
  });
  socket.on("sessionExpirationWarning", () => {
    const hasBeenDismissed = localStorage.getItem(LOCAL_DISMISSED_EXPIRATION_WARNING) === "true";
    if (!hasBeenDismissed) {
      showSessionExpirationWarning.set(true);
    }
  });
  socket.on("disconnect", () => {
    console.log("Chat socket disconnected");
  });
  return socket;
};
