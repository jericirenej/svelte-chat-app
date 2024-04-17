import { page } from "$app/stores";
import type { SocketClient } from "$lib/socket.types";
import { io } from "socket.io-client";
import { get } from "svelte/store";
import { CSRF_HEADER, EXPIRE_SESSION_WARNING_BUFFER, WEBSOCKET_PATH } from "../../constants";
import { handleExtendCall, setRedirectAfterExpire } from "./session-handlers";
import { notificationStore } from "./stores";
import { NOTIFICATION_MESSAGES } from "../../messages";

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
      content: NOTIFICATION_MESSAGES.extend.initial,
      action: async () => {
        await handleExtendCall(socketUIserName);
      },
      lifespan: EXPIRE_SESSION_WARNING_BUFFER
    });

    setRedirectAfterExpire();
  });
  socket.on("disconnect", () => {
    console.log("Chat socket disconnected");
  });
  return socket;
};
