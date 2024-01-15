import type { SocketClient } from "$lib/socket.types";

import { writable, type Writable } from "svelte/store";
export const socket: Writable<SocketClient | undefined> = writable(undefined);

export const showSessionExpirationWarning = writable(false);