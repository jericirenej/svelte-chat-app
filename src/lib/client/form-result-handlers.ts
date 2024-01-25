import type { ActionResult } from "@sveltejs/kit";
import type { FormResult } from "sveltekit-superforms/client";
import { LOCAL_SESSION_CSRF_KEY } from "../../constants";
import { socketClientSetup } from "./socket.client";
import { socket } from "./stores";

type FormEventType = {
  result: ActionResult;
  formEl: HTMLFormElement;
  cancel: () => void;
};

type Status = 200 | 404 | undefined;

export const handleFormResult = <T extends Partial<{ csrfToken: string }>>(
  event: FormEventType,
  pageOrigin: string
): Status => {
  const result = event.result as FormResult<T>;
  if (result.type === "success" && result.data) {
    const data = result.data;
    if (data.csrfToken) {
      localStorage.setItem(LOCAL_SESSION_CSRF_KEY, data.csrfToken);
      socket.set(socketClientSetup(pageOrigin, data.csrfToken));
    }
  }
  return result.status as Status;
};
