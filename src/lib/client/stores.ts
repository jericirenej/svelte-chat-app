import type { SocketClient } from "$lib/socket.types";
import { writable, type Writable } from "svelte/store";
import type { NotificationEntry } from "../../types";

export const socket: Writable<SocketClient | undefined> = writable(undefined);

export const showSessionExpirationWarning = writable(false);
export const notificationStore = writable(new Map<string, NotificationEntry>());
