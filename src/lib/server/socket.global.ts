import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { ExtendedGlobal, SocketServer } from "../socket.types";
import { GlobalThisSocketServer, WEBSOCKET_PATH } from "../../constants";

export const createSocketServer = (server: HttpServer | null) => {
  if (!server) return;
  const extendedGlobal = globalThis as ExtendedGlobal;
  const existingSocket = extendedGlobal[GlobalThisSocketServer];
  if (existingSocket) {
    existingSocket.close();
  }
  const socketServer = new Server(server, { path: WEBSOCKET_PATH }) as SocketServer;
  extendedGlobal[GlobalThisSocketServer] = socketServer;
};
