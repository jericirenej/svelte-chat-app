import type { SocketClient } from "$lib/socket.types";
import { writable, type Writable } from "svelte/store";
import { v4 } from "uuid";
import { type LayoutChatStore, type NotificationEntry, type SingleChatData } from "../../types";

export const socket: Writable<SocketClient | undefined> = writable(undefined);

export const showSessionExpirationWarning = writable(false);
export class NotificationStore {
  #store = writable(new Map<string, NotificationEntry>());

  get subscribe() {
    return this.#store.subscribe;
  }

  get set() {
    return this.#store.set;
  }

  get update() {
    return this.#store.update;
  }

  addNotification(notification: NotificationEntry) {
    this.update((map) => map.set(v4(), notification));
  }
  removeNotification(id: string) {
    this.update((map) => {
      map.delete(id);
      return map;
    });
  }
}
export const notificationStore = new NotificationStore();

export const unreadChatMessages = writable<Record<string, number>>({});
export const chats = writable<Record<string, SingleChatData>>({});
export const usersTyping = writable<Record<string, Set<string> | undefined>>({});
export const chatPreviews = writable<LayoutChatStore[]>([]);

export const clearStores = () => {
  unreadChatMessages.set({});
  chats.set({});
  usersTyping.set({});
  chatPreviews.set([]);
};
