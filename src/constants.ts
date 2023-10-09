/** This s a list of **exact** routes on which no authentication is required.
 * All other routes should perform a check for `sessionId` cookie and and `X-CRSF` header. */
export const UNPROTECTED_ROUTES = ["/", "/login"];

export const SESSION_COOKIE = "chatSessionId";
export const CSRF_HEADER = "X-CSRF";
