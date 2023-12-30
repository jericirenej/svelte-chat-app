import type { SocketClient } from "$lib/types";
import { writable } from "svelte/store";

export const socket = writable(
  undefined as SocketClient | undefined
);
