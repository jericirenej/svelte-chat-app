import { get } from "svelte/store";
import { LOCAL_KEYS, LOCAL_SESSION_CSRF_KEY } from "../../constants";
import type { LayoutData } from "../../routes/$types";
import { socketClientSetup } from "./socket.client";
import { socket } from "./stores";

/** Clear all local storage keys if user no logged in.
 * Set socket connection if it does not exist yet and
 * CSRF token is present in local storage. */
export const layoutOnMountHandler = (data: LayoutData) => {
  if (!data.user) {
    LOCAL_KEYS.forEach((key) => {
      localStorage.removeItem(key);
    });
    return;
  }
  if (get(socket)) return;
  const csrf = localStorage.getItem(LOCAL_SESSION_CSRF_KEY);
  if (!csrf) return;
  socket.set(socketClientSetup(csrf, data.user.username));
};
