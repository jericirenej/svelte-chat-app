import type { SocketServer } from "$lib/types";
import { dbService, redisService } from "@db";
import { CSRF_HEADER, SESSION_COOKIE } from "../../constants";

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

export const setupSocketServer = (socketServer: SocketServer): void => {
  socketServer.on("connection", async (socket) => {
    console.log(`Socket ${socket.id} connection attempted`);

    const { headers } = socket.request;

    const csrfHeader = socket.request.headers[CSRF_HEADER.toLowerCase()] as string;
    const chatSessionId = extractCookies(headers.cookie)?.[SESSION_COOKIE];
    if (!(chatSessionId && csrfHeader)) {
      socket.emit("error", "No chat session cookie or csrf header present. Disconnecting.");
      socket.disconnect(true);
      return;
    }

    const user = await redisService.getSession(chatSessionId);
    if (!user) {
      socket.emit("error", "Invalid session id. Disconnecting");
      socket.disconnect(true);
      return;
    }

    console.log("USER", user.username);

    const chats = await dbService.getChatIdsForUser(user.id);
    console.log("CHATS", chats);

    if (chats.length) {
      await socket.join(chats);
      socket.to(chats).emit("basicEmit", "Chat participants hello!");
    }

    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
};
