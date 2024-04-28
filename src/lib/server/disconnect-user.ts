import type { SocketServer } from "$lib/socket.types";
import { error, type Cookies } from "@sveltejs/kit";
import type { RedisService } from "../../../db/redis/redis-service";
import { disconnectTargetSocket } from "./socket.server";
import { SESSION_COOKIE } from "../../constants";

export const assertSessionCookie = (cookies: Cookies): string => {
  const chatSessionId = cookies.get(SESSION_COOKIE);
  if (!chatSessionId) {
    error(400, "No session id!");
  }
  return chatSessionId;
};

export const closeSocket = async (
  socketServer: SocketServer,
  redisService: RedisService,
  chatSessionId: string
): Promise<void> => {
  const socketId = await redisService.getSocketSession(chatSessionId);
  if (!socketId) {
    console.warn("closeSocket: No active socket detected!");
    return;
  }

  await redisService.deleteSocketSession(chatSessionId);
  await disconnectTargetSocket(socketServer, socketId);
};

/** Logout the current user. Will not check if session exists.
 * Will not authenticate. This is done by the authentication function called
 * previously in the handle hook. */
export const logoutUser = async (
  redisService: RedisService,
  sessionId: string
): Promise<boolean> => {
  const logout = await redisService.deleteSession(sessionId);
  return !!logout;
};
