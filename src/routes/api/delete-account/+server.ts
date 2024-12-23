import { assertSessionCookie, closeSocket, logoutUser } from "$lib/server/disconnect-user";
import { error, type RequestHandler } from "@sveltejs/kit";
import { dbService } from "@db/postgres";
import { redisService } from "@db/redis";

export const DELETE: RequestHandler = async ({ cookies, locals }) => {
  const chatSessionId = assertSessionCookie(cookies);
  const socketServer = locals.socketServer;
  const user = await redisService.getSession(chatSessionId);
  if (!user) {
    return error(500, "Could not correlate session id to user!");
  }
  await dbService.removeUser(user.id, user.id);

  if (socketServer) {
    await closeSocket(socketServer, redisService, chatSessionId);
  }
  await logoutUser(redisService, chatSessionId);

  return new Response("success", { status: 200 });
};
