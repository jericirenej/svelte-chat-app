import { authenticateUser } from "$lib/server/authenticate.js";
import { GlobalThisSocketServer, type ExtendedGlobal } from "$lib/server/socket.js";
import { error, redirect, type Handle, type HandleServerError } from "@sveltejs/kit";
import type { CompleteUserDto } from "../db/index.js";
import {
  CSRF_HEADER,
  LOGIN_ROUTE,
  ROOT_ROUTE,
  SESSION_COOKIE,
  UNPROTECTED_ROUTES
} from "./constants.js";

const hasUserChanged = ({ id: stored }: CompleteUserDto, { id: received }: CompleteUserDto) =>
  stored === received;

const updateLocalsUser = (locals: App.Locals, received: CompleteUserDto | null): void => {
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
 console.log(event.url.href)
  if (!event.locals.socketServer) {
    event.locals.socketServer = (globalThis as ExtendedGlobal)[GlobalThisSocketServer];
  }
  const sessionId = event.cookies.get(SESSION_COOKIE),
    csrfToken = event.request.headers.get(CSRF_HEADER),
    method = event.request.method;
  const isUnprotectedRoute = UNPROTECTED_ROUTES.includes(event.url.pathname),
    isLoginRoute = event.url.pathname === LOGIN_ROUTE,
    isRootRoute = event.url.pathname === ROOT_ROUTE;
  const user = await authenticateUser({ sessionId, csrfToken, method });
  // Clear session id cookie if user is invalid
  if (!user && sessionId) {
    event.cookies.delete(SESSION_COOKIE, {path:"/"});
    event.locals.user = undefined;
  }
  // For non-authorized, non-get methods at non-login endpoint we throw forbidden immediately.
  if (!user && method !== "GET" && !isLoginRoute) {
    throw error(403);
  }

  // Update locals and storage if necessary;
  updateLocalsUser(event.locals, user);

  // Handle protected and unprotected routes
  if (isUnprotectedRoute) {
    if (!sessionId && isRootRoute) {
      throw redirect(302, LOGIN_ROUTE);
    }

    if (sessionId && isLoginRoute) {
      throw redirect(302, ROOT_ROUTE);
    }

    if (isLoginRoute) {
      return await resolve(event);
    }
    return await resolve(event);
  }

  if (!user) {
    throw redirect(302, ROOT_ROUTE);
  }

  return await resolve(event);
};

export const handleError: HandleServerError = ({ event }) => {
  if (event.route.id === null) throw redirect(302, "/");
};
