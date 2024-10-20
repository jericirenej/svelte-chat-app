import { page } from "$app/stores";
import type { SocketClient } from "$lib/socket.types";
import type { MessageDto } from "@db/postgres";
import { io } from "socket.io-client";
import { get } from "svelte/store";
import { CSRF_HEADER, EXPIRE_SESSION_WARNING_BUFFER, WEBSOCKET_PATH } from "../../constants";
import { NOTIFICATION_MESSAGES } from "../../messages";
import { handleExtendCall, setRedirectAfterExpire } from "./session-handlers";
import { chats, notificationStore, usersTyping } from "./stores";

import type { SingleChatData } from "../../types";
import { LayoutClientHandlers } from "./layout-handlers";

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
  socket.on("messagePush", (message: MessageDto) => {
    chats.update((chats) => {
      const target = chats[message.chatId] as SingleChatData | undefined;
      if (!target) {
        return chats;
      }
      if (target.messages.find(({ id }) => id === message.chatId)) {
        return chats;
      }
      target.messages.unshift(message);
      target.total++;
      return chats;
    });
    LayoutClientHandlers.updatePreviewData(message);
  });

  socket.on("userTyping", ({ chatId, status, userId }) => {
    usersTyping.update((list) => {
      if (list[chatId] === undefined) {
        if (!status) return list;
        list[chatId] = new Set<string>();
      }
      const target = list[chatId];
      status ? target.add(userId) : target.delete(userId);
      return list;
    });
  });

  return socket;
};
