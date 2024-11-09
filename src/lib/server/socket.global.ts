import { Server } from "socket.io";
import type { PreviewServer, ViteDevServer } from "vite";
import { GlobalThisSocketServer, WEBSOCKET_PATH } from "../../constants";
import type { ExtendedGlobal, SocketServer } from "../socket.types";

export const createSocketServer = async (
  server: ViteDevServer["httpServer"] | PreviewServer["httpServer"] | null
) => {
  if (!server) return;
  const extendedGlobal = globalThis as ExtendedGlobal;
  const existingSocket = extendedGlobal[GlobalThisSocketServer];
  if (existingSocket) {
    await existingSocket.close();
  }
  const socketServer = new Server(server, { path: WEBSOCKET_PATH }) as SocketServer;
  extendedGlobal[GlobalThisSocketServer] = socketServer;
};
