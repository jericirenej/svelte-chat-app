import { authenticateUserHTTP } from "$lib/server/authenticate.js";
import { error, redirect, type Handle, type HandleServerError } from "@sveltejs/kit";
import type { CompleteUserDto } from "@db/postgres/types.js";
import {
  CSRF_HEADER,
  GlobalThisSocketServer,
  LOGIN_ROUTE,
  ROOT_ROUTE,
  SESSION_COOKIE,
  SIGNUP_ROUTE,
  UNPROTECTED_ROUTES
} from "./constants.js";
import { setupSocketServer } from "$lib/server/socket.server.js";
import type { ExtendedGlobal } from "$lib/socket.types.js";
import { BlobStorageService } from "@db/index.js";

let socketServerInitialized = false;
const extendedGlobal = globalThis as ExtendedGlobal;

const initializeSocketServer = (): void => {
  if (socketServerInitialized || !extendedGlobal[GlobalThisSocketServer]) return;
  setupSocketServer(extendedGlobal[GlobalThisSocketServer]);
  socketServerInitialized = true;
};

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

export const blobService = new BlobStorageService();

// eslint-disable-next-line @typescript-eslint/unbound-method
export const handle: Handle = async ({ event, resolve }) => {
  initializeSocketServer();
  if (!event.locals.socketServer) {
    event.locals.socketServer = extendedGlobal[GlobalThisSocketServer];
  }
  const sessionId = event.cookies.get(SESSION_COOKIE),
    csrfToken = event.request.headers.get(CSRF_HEADER),
    method = event.request.method;
  const isUnprotectedRoute = UNPROTECTED_ROUTES.includes(event.url.pathname),
    isLoginRoute = event.url.pathname === LOGIN_ROUTE,
    isSignupRoute = event.url.pathname === SIGNUP_ROUTE,
    isRootRoute = event.url.pathname === ROOT_ROUTE;
  const user = await authenticateUserHTTP({ sessionId, csrfToken, method });
  // Clear session id cookie if user is invalid
  if (!user && sessionId) {
    event.cookies.delete(SESSION_COOKIE, { path: "/" });
    event.locals.user = undefined;
  }
  // For non-authorized, non-get methods at authorized endpoints throw immediately.
  if (!user && method !== "GET" && !(isLoginRoute || isSignupRoute)) {
    return error(403);
  }

  // Update locals and storage if necessary;
  updateLocalsUser(event.locals, user);

  // Handle protected and unprotected routes
  if (isUnprotectedRoute) {
    if (!sessionId && isRootRoute) {
      return redirect(302, LOGIN_ROUTE);
    }

    if (sessionId && (isLoginRoute || isSignupRoute)) {
      return redirect(302, ROOT_ROUTE);
    }

    return await resolve(event);
  }
  if (!user) {
    return redirect(302, LOGIN_ROUTE);
  }
  return await resolve(event);
};

export const handleError: HandleServerError = ({ event, error }) => {
  console.error(error);
  if (event.route.id === null) return redirect(302, "/");
};
