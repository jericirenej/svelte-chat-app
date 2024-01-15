import type { SocketServer } from "$lib/socket.types";
import { dbService, redisService } from "@db";
import { CSRF_HEADER, SESSION_COOKIE, SESSION_WARNING_BUFFER } from "../../constants";
import { authenticateUserWS } from "./authenticate";

const extractCookies = (cookie?: string): Record<string, string> | null => {
  if (!cookie) return null;
  return cookie.split("; ").reduce(
    (hash, cookieEntry) => {
      const [prop, val] = cookieEntry.split("=");
      hash[prop] = val;
      return hash;
    },
    {} as Record<string, string>
  );
};

const removeDuplicatedSocketIfExists = async (
  socketServer: SocketServer,
  sessionId: string
): Promise<void> => {
  const sessionSocket = await redisService.getSocketSession(sessionId);
  if (!sessionSocket) return;
  const sockets = await socketServer.fetchSockets();
  console.log("Disconnecting socket from orphaned session");
  sockets.find(({ id }) => id === sessionSocket)?.disconnect(true);
  await redisService.deleteSocketSession(sessionId);
};


export const setupSocketServer = (socketServer: SocketServer): void => {
  socketServer.on("connect", async (socket) => {
    let sessionTimeoutWarning: NodeJS.Timeout;
    console.log(`Socket ${socket.id} connection attempted`);

    const { headers } = socket.request;

    const csrfToken = socket.request.headers[CSRF_HEADER.toLowerCase()] as string;
    const sessionId = extractCookies(headers.cookie)?.[SESSION_COOKIE];
    if (!(sessionId && csrfToken)) {
      socket.emit("error", "No chat session cookie or csrf header present. Disconnecting.");
      socket.disconnect(true);
      return;
    }

    const user = await authenticateUserWS({ sessionId, csrfToken });

    if (!user) {
      socket.emit("error", "Authentication failed. Disconnecting.");
      socket.disconnect(true);
      return;
    }

    await removeDuplicatedSocketIfExists(socketServer, sessionId);
    await redisService.setSocketSession(sessionId, socket.id);

    const sessionTTL = await redisService.getSessionTTL(sessionId);
    // eslint-disable-next-line prefer-const
    sessionTimeoutWarning = setTimeout(
      () => {
        socket.emit("sessionExpirationWarning");
      },
      sessionTTL * 1000 - SESSION_WARNING_BUFFER
    );

    const chats = await dbService.getChatIdsForUser(user.id);
    if (chats.length) {
      await socket.join(chats);
      socket.to(chats).emit("participantOnline", user.username, true);
    }
    socket.on("disconnect", () => {
      clearTimeout(sessionTimeoutWarning);
      socket.to([...socket.rooms]).emit("participantOnline", user.username, false);
      console.log(`Socket ${socket.id} disconnected`);
      socket.disconnect(true);
    });
  });
};
