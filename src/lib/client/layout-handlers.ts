import { page } from "$app/stores";
import { get } from "svelte/store";
import { CHAT_ROUTE, LOCAL_KEYS, LOCAL_SESSION_CSRF_KEY } from "../../constants";
import type { LayoutData } from "../../routes/$types";
import { chatPreviews, socket, unreadChatMessages } from "./stores";
import { socketClientSetup } from "./socket.client";
import type { LayoutChatStore } from "../../types";
import type { MessageDto } from "@db/postgres";

export class LayoutClientHandlers {
  /** Clear all local storage keys if user no logged in. Set socket connection if
   * CSRF token is present in the local storage. */
  static onMountHandler(data: LayoutData) {
    if (!data.user) {
      LOCAL_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });
      return;
    }
  }

  static initiateSocket(data: LayoutData) {
    if (get(socket)) return;
    const csrf = localStorage.getItem(LOCAL_SESSION_CSRF_KEY);
    if (!csrf) return;
    socket.set(socketClientSetup(csrf, data.user?.username));
  }
  static setPreviewAndUnreadOnLoad(data: LayoutData) {
    if (!data.chats) return;
    const chatPreviewData: LayoutChatStore[] = [];
    const unread = data.chats.reduce(
      (acc, chat) => {
        acc[chat.chatId] = chat.unreadMessages;
        const { chatId, chatLabel, message, totalMessages } = chat;
        chatPreviewData.push({ chatId, chatLabel, message, totalMessages });
        return acc;
      },
      {} as Record<string, number>
    );
    unreadChatMessages.set(unread);
    chatPreviews.set(chatPreviewData);
  }

  static updatePreviewData(message: MessageDto) {
    const { url } = get(page);
    // We can't have unread messages if we are in the chat that was updated.
    if (url.pathname !== `/${CHAT_ROUTE}/${message.chatId}`) {
      unreadChatMessages.update((unread) => {
        if (!unread[message.chatId]) return unread;
        unread[message.chatId]++;
        return unread;
      });
    }
    chatPreviews.update((chats) => {
      const target = chats.find((c) => c.chatId === message.chatId);
      if (!target) {
        return chats;
      }
      target.totalMessages++;
      target.message = message.message;
      return chats;
    });
  }
}
