import type { SocketServer } from "$lib/socket.types";
import { dbService } from "@db/postgres/db-service";
import { redisService } from "@db/redis/";
import { CSRF_HEADER, SESSION_COOKIE, EXPIRE_SESSION_WARNING_BUFFER } from "../../constants";
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
  sockets.find(({ id }) => id === sessionSocket)?.disconnect(true);
  await redisService.deleteSocketSession(sessionId);
};

export const disconnectTargetSocket = async (socketServer: SocketServer, socketId: string) => {
  const sockets = await socketServer.fetchSockets();
  const targetSocket = sockets.find(({ id }) => id === socketId);
  targetSocket?.disconnect(true);
};

export const setupSocketServer = (socketServer: SocketServer): void => {
  socketServer.on("connect", async (socket) => {
    let sessionTimeoutWarning: NodeJS.Timeout;

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
      sessionTTL * 1000 - EXPIRE_SESSION_WARNING_BUFFER
    );

    const chats = await dbService.getChatIdsForUser(user.id);
    if (chats.length) {
      await socket.join(chats);
      socket.to(chats).emit("participantOnline", user.username, true);
    }
    socket.on("disconnect", () => {
      clearTimeout(sessionTimeoutWarning);
      socket.to([...socket.rooms]).emit("participantOnline", user.username, false);
      socket.disconnect(true);
    });
    socket.on("messagePush", (message) => {
      if (!socket.rooms.has(message.chatId)) {
        console.warn("Tried to send message to chat, but chat room does not exist");
        return;
      }
      socket.broadcast.to(message.chatId).emit("messagePush", message);
    });

    socket.on("userTyping", (args) => {
      if (!socket.rooms.has(args.chatId)) {
        console.warn("Tried to send typing update to chat, but chat room does not exist");
        return;
      }
      socket.broadcast.to(args.chatId).emit("userTyping", args);
    });
    socket.on("participantLeftChat", (chatId, participantId) => {
      if (!socket.rooms.has(chatId)) {
        console.warn("Tried to send typing update to chat, but chat room does not exist");
        return;
      }
      socket.broadcast.to(chatId).emit("participantLeftChat", chatId, participantId);
    });
    socket.on("chatCreated", async (chatId, chatLabel, participants) => {
      const sessionIds = (
        await Promise.all(
          participants.map(async ({ id }) => await redisService.getUserSessions(id))
        )
      ).flat();
      const socketSessions = (
        await Promise.all(sessionIds.map(async (id) => await redisService.getSocketSession(id)))
      ).filter((socket): socket is string => socket !== null);
      const sockets = (await socketServer.fetchSockets()).filter((socket) =>
        socketSessions.includes(socket.id)
      );
      sockets.map((socket) => {
        socket.join(chatId);
      });
      socket.to(chatId).emit("chatCreated", chatId, chatLabel, participants);
    });
  });
};
