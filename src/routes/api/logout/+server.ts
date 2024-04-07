import { assertSessionCookie, closeSocket, logoutUser } from "$lib/server/disconnect-user.js";
import { secureCookieEval } from "$lib/utils.js";
import { redisService } from "@db";
import { error, type RequestHandler } from "@sveltejs/kit";
import { SESSION_COOKIE } from "../../../constants.js";

export const DELETE: RequestHandler = async ({ cookies, url, locals }) => {
  const chatSessionId = assertSessionCookie(cookies);
  cookies.delete(SESSION_COOKIE, { secure: secureCookieEval(url), path: "/" });
  const socketServer = locals.socketServer;
  if (socketServer) {
    await closeSocket(socketServer, redisService, chatSessionId);
  }
  const logout = await logoutUser(redisService, chatSessionId);
  if (!logout) {
    throw error(500, "Error while performing logout!");
  }

  return new Response(null, { status: 200 });
};
