import type { ActionResult } from "@sveltejs/kit";
import type { FormResult } from "sveltekit-superforms/client";
import {
  CSRF_HEADER,
  EXTEND_SESSION_ROUTE,
  LOCAL_KEYS,
  LOCAL_SESSION_CSRF_KEY,
  LOGOUT_ROUTE
} from "../../constants";
import { socketClientSetup } from "./socket.client";
import { socket } from "./stores";

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
export const handleFormResult = <T extends Partial<{ csrfToken: string }>>(
  event: FormEventType,
  pageOrigin: string
): number | undefined => {
  const result = event.result as FormResult<T>;
  const status = result.status;
  if (result.type !== "success" || !result.data) {
    return status;
  }
  if (!result.data.csrfToken) return status;
  const tokenSet = setCSRFLocal(result.data.csrfToken);
  if (!tokenSet) return status;

  socket.set(socketClientSetup(pageOrigin, result.data.csrfToken));

  return result.status;
};

const csrfHeader = (csrf: string) => ({ [CSRF_HEADER]: csrf });

const extendCall = (csrf: string) =>
  fetch(EXTEND_SESSION_ROUTE, { method: "POST", headers: { ...csrfHeader(csrf) } });

const logoutCall = (csrf: string) =>
  fetch(LOGOUT_ROUTE, { method: "DELETE", headers: { ...csrfHeader(csrf) } });

/** Perform a call to the logout endpoint, remove
 * local storage entries and set socket to undefined. */
export const handleLogoutCall = async () => {
  const csrf = getCSRFLocal();
  if (!csrf) return;
  await logoutCall(csrf);
  LOCAL_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
  socket.set(undefined);
};

/** Call the extend endpoint and re-set socket
 * If csrf token or username is not present or
 * the API call 's result is not 201,
 * it will register as failed. */
export const handleExtendCall = async (
  origin: string,
  username?: string
): Promise<"success" | "fail"> => {
  const csrf = getCSRFLocal();
  if (!username || !csrf) return "fail";
  const response = await extendCall(csrf);
  if (response.status !== 201) return "fail";
  const parsed = (await response.json()) as Partial<Record<"csrf", string>>;
  if (!parsed.csrf) return "fail";
  const tokenSet = setCSRFLocal(parsed.csrf);
  if (!tokenSet) return "fail";
  socketClientSetup(origin, parsed.csrf, username);
  return "success";
};
