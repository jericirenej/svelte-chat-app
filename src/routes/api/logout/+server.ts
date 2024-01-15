import { error, type RequestHandler } from "@sveltejs/kit";
import { SESSION_COOKIE } from "../../../constants.js";
import { secureCookieEval } from "$lib/utils.js";
import { redisService } from "@db";

/** Logout the current user. Will not check if session exists.
 * Will not authenticate. This is done by the authentication function called
 * previously in the handle hook. */
const logoutUser = async (sessionId: string): Promise<boolean> => {
  const logout = await redisService.deleteSession(sessionId);
  return !!logout;
};

export const DELETE: RequestHandler = async ({ cookies, url, locals }) => {
  const chatSessionId = cookies.get(SESSION_COOKIE);
  if (!chatSessionId) {
    throw error(400, "No session id!");
  }
  cookies.delete(SESSION_COOKIE, { secure: secureCookieEval(url), path: "/" });
  const socketServer = locals.socketServer;
  if (socketServer) {
    const socketId = await redisService.getSocketSession(chatSessionId);
    if (socketId) {
      await redisService.deleteSocketSession(chatSessionId);
      const sockets = await socketServer.fetchSockets();
      const targetSocket = sockets.find(({ id }) => id === socketId);
      targetSocket?.disconnect(true);
    }
  }
  const logout = await logoutUser(chatSessionId);
  if (!logout) {
    throw error(500, "Error while performing logout!");
  }
  
  return new Response(null, { status: 200 });
};
