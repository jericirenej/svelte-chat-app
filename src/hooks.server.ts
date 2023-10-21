import { authenticateUser } from "$lib/server/authenticate.js";
import { error, redirect, type Handle } from "@sveltejs/kit";
import type { CompleteUserDto } from "../db/index.js";
import { CSRF_HEADER, LOGIN_ROUTE, SESSION_COOKIE, UNPROTECTED_ROUTES } from "./constants.js";

const hasUserChanged = ({ id: stored }: CompleteUserDto, { id: received }: CompleteUserDto) =>
  stored === received;

const updateLocalsUser = (locals: App.Locals, received: CompleteUserDto | null) => {
  const { user } = locals;
  if (!received) {
    locals.user = undefined;
    return;
  }
  if (!user) {
    locals.user = received;
    return;
  }

  if (hasUserChanged(user, received)) locals.user = received;
  return;
};

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(SESSION_COOKIE),
    csrfToken = event.request.headers.get(CSRF_HEADER),
    method = event.request.method;
  const isUnprotectedRoute = UNPROTECTED_ROUTES.includes(event.url.pathname),
    isLoginRoute = event.url.pathname === LOGIN_ROUTE;
  const user = await authenticateUser({ sessionId, csrfToken, method });
  // Clear session id cookie if user is invalid
  if (!user && sessionId) {
    event.cookies.delete(SESSION_COOKIE);
    event.locals.user = undefined;
  }
  // For non-authorized, non-get methods at non-login endpoint we throw forbidden immediately.
  if (!user && method !== "GET" && !isLoginRoute) {
    throw error(403);
  }

  // Update locals and storage if necessary;
  updateLocalsUser(event.locals, user);

  // Handle protected and unprotecteed routes
  if (!sessionId && isUnprotectedRoute) {
    return await resolve(event);
  }

  // Otherwise resolve as appropriate
  if (isUnprotectedRoute) {
    if (isLoginRoute && sessionId) {
      throw redirect(302, "/");
    }
    return await resolve(event);
  }

  if (!user) {
    throw redirect(302, "/login");
  }

  return await resolve(event);
};
