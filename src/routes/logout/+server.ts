import { error, type RequestHandler } from "@sveltejs/kit";
import { SESSION_COOKIE } from "../../constants.js";
import { logoutUser } from "../../lib/server/authenticate.js";
import { secureCookieEval } from "$lib/utils.js";

export const DELETE: RequestHandler = async ({ cookies, url }) => {
  const chatSessionId = cookies.get(SESSION_COOKIE);
  if (!chatSessionId) {
    throw error(400, "No session id!");
  }
  const logout = await logoutUser(chatSessionId);
  if (!logout) {
    throw error(500, "Error while performing logout!");
  }
  cookies.delete(SESSION_COOKIE, { secure: secureCookieEval(url) });
  return new Response(null, { status: 200 });
};
