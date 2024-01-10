import type { SocketClient } from "$lib/socket.types";
import { io } from "socket.io-client";
import { writable, type Writable } from "svelte/store";
import { CSRF_HEADER, WEBSOCKET_PATH } from "../../constants";

export const socketClientSetup = (origin: string, csrfToken: string): SocketClient => {
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
    console.log(`${username} ${online ? "is online" : "is offline"}`);
  });
  socket.on("disconnect", () => {
    console.log("Chat socket disconnected");
  });
  return socket;
};

export const socket: Writable<SocketClient | undefined> = writable(undefined);
