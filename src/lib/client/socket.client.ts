import { page } from "$app/stores";
import type { SocketClient } from "$lib/socket.types";
import { io } from "socket.io-client";
import { get } from "svelte/store";
import { CSRF_HEADER, WEBSOCKET_PATH } from "../../constants";
import { EXPIRATION_MESSAGES } from "../../messages";
import { handleExtendCall } from "./session-handlers";
import { notificationStore } from "./stores";

const getOrigin = (): string => get(page).url.origin;

export const socketClientSetup = (csrfToken: string, socketUIserName?: string): SocketClient => {
  const socket = io(getOrigin(), {
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
    notificationStore.addNotification({
      content: EXPIRATION_MESSAGES.initial,
      action: async () => {
        await handleExtendCall(socketUIserName);
      }
    });
  });
  socket.on("disconnect", () => {
    console.log("Chat socket disconnected");
  });
  return socket;
};
