import type { RequestEvent } from "@sveltejs/kit";
import type { CompleteUserDto } from "../../../db/index.js";
import { CSRF_HEADER, SESSION_COOKIE } from "../../constants.js";
import { getSessionFromCsrfToken, verifyCsrfToken } from "../../utils/password-utils.js";

export const authenticateUser = async ({
  cookies,
  request: { headers }
}: RequestEvent): Promise<CompleteUserDto | null> => {
  console.log("ENTERED HANDLE");
  const chatSessionId = cookies.get(SESSION_COOKIE);
  if (!chatSessionId) return null;

  const csrfToken = headers.get(CSRF_HEADER);
  if (!(csrfToken && verifyCsrfToken(csrfToken))) return null;

  const csrfSession = getSessionFromCsrfToken(csrfToken);

  if (csrfSession !== chatSessionId) return null;

  /* const user = await redisService.getSession(chatSessionId); */
  return null;
};
