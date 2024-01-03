import type { SocketClient } from "$lib/types";
import { writable, type Writable } from "svelte/store";

export const socket:Writable<SocketClient|undefined> = writable(
  undefined
);
