import type { SocketClient } from "$lib/socket.types";
import { derived, writable, type Writable } from "svelte/store";
import { v4 } from "uuid";
import {
  type LayoutChats,
  type NotificationEntry,
  type ParticipantData,
  type SingleChatData,
  type UnreadChatMessages,
  type UsersTyping
} from "../../types";

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

export const socket: Writable<SocketClient | undefined> = writable(undefined);
export const showSessionExpirationWarning = writable(false);
export const notificationStore = new NotificationStore();

export const unreadChatMessages = writable<UnreadChatMessages>({});
export const chatPreviews = writable<LayoutChats[]>([]);
export const chats = writable<Record<string, SingleChatData | undefined>>({});
export const userMap = derived(
  chatPreviews,
  ($chatPreviews, _set, update) => {
    update((map) => {
      $chatPreviews
        .map(({ participants }) => participants)
        .flatMap((participants) => {
          return participants.map((p) => [p.id, p] as [string, ParticipantData]);
        })
        .forEach(([id, p]) => {
          if (map.has(id)) return;
          map.set(id, p);
        });
      return map;
    });
    /* return new Map(
      Object.values($chats)
        .filter((c): c is SingleChatData => !!c)
        .flatMap(({ participants }) => participants.map((p) => [p.id, p]))
    ); */
  },
  new Map<string, ParticipantData>()
);
export const usersTyping = writable<UsersTyping>({});

export const clearChatRelatedStores = () => {
  unreadChatMessages.set({});
  chats.set({});
  usersTyping.set({});
  chatPreviews.set([]);
};
