import { redisService } from "@db";
import { redirect, type Cookies, type Handle } from "@sveltejs/kit";
import { CSRF_HEADER, SESSION_COOKIE, UNPROTECTED_ROUTES } from "./constants.js";
import { getSessionFromCsrfToken, verifyCsrfToken } from "./utils/password-utils.js";

const throwUnauthenticated = (cookies?: Cookies): never => {
  if (cookies) cookies.delete(SESSION_COOKIE);
  throw redirect(302, "/login");
};

export const handle: Handle = async ({ event, resolve }) => {
  const cookies = event.cookies;
  const headers = event.request.headers;
  const { pathname } = event.url;
  if (UNPROTECTED_ROUTES.includes(pathname)) {
    return await resolve(event);
  }
  const chatSessionId = cookies.get(SESSION_COOKIE);
  if (!chatSessionId) return throwUnauthenticated();

  const csrfToken = headers.get(CSRF_HEADER);
  if (!(csrfToken && verifyCsrfToken(csrfToken))) return throwUnauthenticated(cookies);

  const csrfSession = getSessionFromCsrfToken(csrfToken);

  if (csrfSession !== chatSessionId) return throwUnauthenticated(cookies);

  const user = await redisService.getSession(chatSessionId);

  if (!user) return throwUnauthenticated(cookies);

  console.log(user);
  event.locals.user = user;

  return await resolve(event);
};
