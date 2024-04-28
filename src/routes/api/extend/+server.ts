import { error, json, type RequestHandler } from "@sveltejs/kit";
import { CSRF_HEADER, SESSION_COOKIE } from "../../../constants";
import { generateCsrfToken, generateSessionId } from "$lib/server/password-utils";
import { redisService } from "../../../../db/redis/redis-service";
import { secureCookieEval } from "$lib/utils";

export const POST: RequestHandler = async ({ url, cookies, request, locals }) => {
  const currentSessionId = cookies.get(SESSION_COOKIE),
    currentCsrf = request.headers.get(CSRF_HEADER);
  if (!locals.user) {
    error(500);
  }
  if (!currentSessionId || !currentCsrf) {
    error(403);
  }

  const newSessionId = generateSessionId(locals.user.id),
    newCsrfToken = generateCsrfToken(newSessionId);

  const user = await redisService.replaceSessionKey(currentSessionId, newSessionId);
  if (!user) {
    error(500);
  }

  cookies.set(SESSION_COOKIE, newSessionId, {
    httpOnly: true,
    maxAge: redisService.ttl,
    sameSite: true,
    path: "/",
    secure: secureCookieEval(url)
  });
  const { socketServer } = locals;
  if (socketServer) {
    const sockets = await socketServer.fetchSockets();
    const target = sockets.find(({ id }) => currentSessionId === id);
    target?.disconnect(true);
  }
  return json({ csrf: newCsrfToken }, { status: 201 });
};
