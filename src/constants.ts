export const ROOT_ROUTE = "/",
  LOGIN_ROUTE = "/login",
  SIGNUP_ROUTE = "/signup",
  PROFILE_ROUTE = "/profile",
  CHAT_ROUTE = "/chat",
  CREATE_CHAT_ROUTE = "/create";
/** This s a list of **exact** routes on which no authentication is required.
 * All other routes should perform a check for `sessionId` cookie and and `X-CRSF` header. */
export const UNPROTECTED_ROUTES = [LOGIN_ROUTE, SIGNUP_ROUTE];
export const LOGOUT_ROUTE = "/api/logout",
  EXTEND_SESSION_ROUTE = "/api/extend",
  DELETE_ACCOUNT_ROUTE = "/api/delete-account",
  API_ROUTES = [LOGOUT_ROUTE, EXTEND_SESSION_ROUTE, DELETE_ACCOUNT_ROUTE];

export const SESSION_COOKIE = "chatSessionId";
export const CSRF_HEADER = "X-CSRF";
export const GlobalThisSocketServer = Symbol.for("sveltekit.socket.io");
export const WEBSOCKET_PATH = "/websocket";

export const EXPIRE_SESSION_WARNING_BUFFER = 1e4; //3e4;
export const REDIRECT_AFTER_EXPIRE_DELAY = 5e3;

export const LOCAL_SESSION_CSRF_KEY = "csrfToken";
export const LOCAL_EXPIRE_REDIRECT = "redirectAfterExpire";
export const LOCAL_KEYS = [LOCAL_SESSION_CSRF_KEY, LOCAL_EXPIRE_REDIRECT];
export const MESSAGE_TAKE = 20;
