import { goto, invalidateAll } from "$app/navigation";
import type { ActionResult, SubmitFunction } from "@sveltejs/kit";
import {
  DELETE_ACCOUNT_ROUTE,
  EXPIRE_SESSION_WARNING_BUFFER,
  EXTEND_SESSION_ROUTE,
  LOCAL_EXPIRE_REDIRECT,
  LOCAL_KEYS,
  LOGIN_ROUTE,
  LOGOUT_ROUTE,
  REDIRECT_AFTER_EXPIRE_DELAY
} from "../../constants";
import { NOTIFICATION_MESSAGES } from "../../messages";
import { csrfHeader, getCSRFLocal, setCSRFLocal } from "./csrf-handlers";
import { socketClientSetup } from "./socket.client";
import { clearChatRelatedStores, notificationStore, socket } from "./stores";

type FormEventType = {
  result: ActionResult<Partial<{ csrfToken: string; username: string }>>;
  formEl: HTMLFormElement;
  cancel: () => void;
};

export const handleNotification = async ({
  response,
  successCodes = [200, 201],
  successMsg = NOTIFICATION_MESSAGES.defaultSuccess,
  defaultFailMsg = NOTIFICATION_MESSAGES.defaultFail,
  failMessages = {},
  lifespan,
  notificationOnNull = false
}: {
  response: Response | null;
  successCodes?: number[];
  successMsg?: string;
  defaultFailMsg?: string;
  failMessages?: Record<number, string>;
  lifespan?: number;
  notificationOnNull?: boolean;
}): Promise<void> => {
  if (!response) {
    if (notificationOnNull) {
      notificationStore.addNotification({
        content: defaultFailMsg,
        type: "failure"
      });
    }
    return;
  }
  if (successCodes.includes(response.status)) {
    notificationStore.addNotification({ content: successMsg, lifespan, type: "default" });
    return;
  }
  let content: string;
  const { message } = (await response.json()) as { message?: string };
  switch (true) {
    case !!failMessages[response.status]:
      content = failMessages[response.status];
      break;
    case response.status === 403:
      content = NOTIFICATION_MESSAGES[403];
      break;
    case !!message:
      content = message;
      break;
    default:
      content = defaultFailMsg;
  }
  notificationStore.addNotification({ content, lifespan, type: "failure" });
};

export const setRedirectAfterExpire = () => {
  const timeout = setTimeout(() => {
    notificationStore.addNotification({
      content: NOTIFICATION_MESSAGES.extend.redirectNotification,
      type: "secondary",
      lifespan: REDIRECT_AFTER_EXPIRE_DELAY
    });
    setTimeout(() => {
      void goto(LOGIN_ROUTE);
    }, REDIRECT_AFTER_EXPIRE_DELAY);
  }, EXPIRE_SESSION_WARNING_BUFFER);
  localStorage.setItem(LOCAL_EXPIRE_REDIRECT, (timeout as unknown as number).toString());
};

export const clearExpireRedirect = () => {
  const timeoutVal = localStorage.getItem(LOCAL_EXPIRE_REDIRECT);
  const timeoutId = Number(timeoutVal);
  if (!timeoutId) return;
  clearTimeout(timeoutId);
  localStorage.removeItem(LOCAL_EXPIRE_REDIRECT);
};
/** On successful result, set CSRF token in localStorage and open
 * setup web socket connection. */
export const handleLoginResult = (event: FormEventType): number | undefined => {
  const result = event.result;
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

export const createChatCall = async (input: Parameters<SubmitFunction>[0]) => {
  const csrf = getCSRFLocal();
  if (!csrf) return new Response();
  const response = await fetch(input.action, {
    method: "POST",
    headers: csrfHeader(csrf),
    body: input.formData
  });
  await handleNotification({ response });
  return response;
};

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
): Promise<Response | null> => {
  const csrf = getCSRFLocal();
  if (!csrf) return null;
  const response = await cb(csrf);

  if (response.status !== validResponse) {
    console.warn(
      `Request returned response ${response.status}, where ${validResponse} was expected. Keeping session intact.`
    );
    return response;
  }
  clearExpireRedirect();
  LOCAL_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
  clearChatRelatedStores();
  return response;
};

const invalidateAndNavigateOnSuccess = async (status: number | null | undefined): Promise<void> => {
  if (status !== 200) {
    return;
  }
  await invalidateAll();
  void goto("/");
};

/** Perform a call to the logout endpoint, remove
 * local storage entries and set socket to undefined. */
export const handleLogoutCall = async (): Promise<void> => {
  const response = await handleRequestAndCloseSession(logoutCall);
  await handleNotification({ response, successMsg: NOTIFICATION_MESSAGES.logoutSuccess });
  await invalidateAndNavigateOnSuccess(response?.status);
};

export const handleDeleteAccountCall = async (): Promise<void> => {
  const response = await handleRequestAndCloseSession(deleteAccountCall);
  await handleNotification({ response, successMsg: NOTIFICATION_MESSAGES.deleteAccountSuccess });
  await invalidateAndNavigateOnSuccess(response?.status);
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
    await handleNotification({ response, successMsg: NOTIFICATION_MESSAGES.extend.success });
    clearExpireRedirect();
  } catch {
    await handleNotification({
      response: null,
      notificationOnNull: true,
      defaultFailMsg: NOTIFICATION_MESSAGES.extend.fail
    });
  }
};
