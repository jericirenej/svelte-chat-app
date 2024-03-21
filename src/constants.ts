export const ROOT_ROUTE = "/";
export const LOGIN_ROUTE = "/login";
export const SIGNUP_ROUTE = "/signup"
/** This s a list of **exact** routes on which no authentication is required.
 * All other routes should perform a check for `sessionId` cookie and and `X-CRSF` header. */
export const UNPROTECTED_ROUTES = [ROOT_ROUTE, LOGIN_ROUTE, SIGNUP_ROUTE];
export const LOGOUT_ROUTE = "/api/logout",
  EXTEND_SESSION_ROUTE = "/api/extend",
  API_ROUTES = [LOGOUT_ROUTE, EXTEND_SESSION_ROUTE];

export const SESSION_COOKIE = "chatSessionId";
export const CSRF_HEADER = "X-CSRF";
export const LOCAL_SESSION_CSRF_KEY = "csrfToken";
export const LOCAL_DISMISSED_EXPIRATION_WARNING = "dismissedExpiration";
export const GlobalThisSocketServer = Symbol.for("sveltekit.socket.io");
export const WEBSOCKET_PATH = "/websocket";

export const LOCAL_KEYS = [LOCAL_SESSION_CSRF_KEY, LOCAL_DISMISSED_EXPIRATION_WARNING];
export const SESSION_WARNING_BUFFER = 1e4; //3e4;


export const EXPIRATION_MESSAGES = {
    initial: "Session will expire soon.\nClick here to extend.",
    fail: "Failed to extend session\t😭",
    success: "Session extended\t👍"
  };