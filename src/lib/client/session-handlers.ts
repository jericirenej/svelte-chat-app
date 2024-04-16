import { goto, invalidateAll } from "$app/navigation";
import type { ActionResult } from "@sveltejs/kit";
import type { FormResult } from "sveltekit-superforms/client";
import {
  CSRF_HEADER,
  DELETE_ACCOUNT_ROUTE,
  EXTEND_SESSION_ROUTE,
  LOCAL_KEYS,
  LOCAL_SESSION_CSRF_KEY,
  LOGOUT_ROUTE
} from "../../constants";
import { socketClientSetup } from "./socket.client";
import { notificationStore, socket } from "./stores";
import { EXPIRATION_MESSAGES } from "../../messages";

type FormEventType = {
  result: ActionResult;
  formEl: HTMLFormElement;
  cancel: () => void;
};

export const setCSRFLocal = (csrfToken: string | undefined): boolean => {
  if (!csrfToken) return false;
  localStorage.setItem(LOCAL_SESSION_CSRF_KEY, csrfToken);
  return true;
};

export const getCSRFLocal = () => localStorage.getItem(LOCAL_SESSION_CSRF_KEY);

/** On successful result, set CSRF token in localStorage and open
 * setup web socket connection. */
export const handleFormResult = <T extends Partial<{ csrfToken: string; username: string }>>(
  event: FormEventType
): number | undefined => {
  const result = event.result as FormResult<T>;
  const status = result.status;
  if (result.type !== "success" || !result.data) {
    return status;
  }
  if (!result.data.csrfToken) return status;
  const tokenSet = setCSRFLocal(result.data.csrfToken);
  if (!tokenSet) return status;
  if (result.data.username) {
    socket.set(socketClientSetup(result.data.csrfToken, result.data.username));
  }

  return result.status;
};

const csrfHeader = (csrf: string) => ({ [CSRF_HEADER]: csrf });

const extendCall = (csrf: string) =>
  fetch(EXTEND_SESSION_ROUTE, { method: "POST", headers: { ...csrfHeader(csrf) } });

const logoutCall = (csrf: string) =>
  fetch(LOGOUT_ROUTE, { method: "DELETE", headers: { ...csrfHeader(csrf) } });

const deleteAccountCall = (csrf: string) =>
  fetch(DELETE_ACCOUNT_ROUTE, {
    method: "DELETE",
    headers: { ...csrfHeader(csrf) }
  });

const handleRequestAndCloseSession = async (
  cb: (csrf: string) => Promise<Response>,
  validResponse = 200
): Promise<number | null> => {
  const csrf = getCSRFLocal();
  if (!csrf) return null;
  const response = await cb(csrf);

  if (response.status !== validResponse) {
    console.warn(
      `Request returned response ${response.status}, where ${validResponse} was expected. Keeping session intact.`
    );
    return response.status;
  }
  LOCAL_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
  socket.set(undefined);
  return response.status;
};

const invalidateAndNavigateOnSuccess = async (status: number | null): Promise<void> => {
  if (status !== 200) {
    return;
  }
  await invalidateAll();
  void goto("/");
};

/** Perform a call to the logout endpoint, remove
 * local storage entries and set socket to undefined. */
export const handleLogoutCall = async (): Promise<void> => {
  const status = await handleRequestAndCloseSession(logoutCall);
  await invalidateAndNavigateOnSuccess(status);
};

export const handleDeleteAccountCall = async (): Promise<void> => {
  const status = await handleRequestAndCloseSession(deleteAccountCall);
  await invalidateAndNavigateOnSuccess(status);
};

/** Call the extend endpoint and re-set socket
 * If csrf token or username is not present or
 * the API call 's result is not 201,
 * it will register as failed. */
export const handleExtendCall = async (username?: string): Promise<void> => {
  try {
    const csrf = getCSRFLocal();
    if (!username || !csrf) throw new Error();
    const response = await extendCall(csrf);
    if (response.status !== 201) throw new Error();
    const parsed = (await response.json()) as Partial<Record<"csrf", string>>;
    if (!parsed.csrf) throw new Error();
    const tokenSet = setCSRFLocal(parsed.csrf);
    if (!tokenSet) throw new Error();
    socketClientSetup(parsed.csrf, username);
    notificationStore.addNotification({ content: EXPIRATION_MESSAGES.success, type: "default" });
  } catch {
    notificationStore.addNotification({ content: EXPIRATION_MESSAGES.fail, type: "failure" });
  }
};
