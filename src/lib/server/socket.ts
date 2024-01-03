import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { ExtendedGlobal, SocketServer } from "../types";
import { GlobalThisSocketServer } from "../../constants";

export const createSocketServer = (server: HttpServer | null) => {
  if (!server) return;
  const socketServer = new Server(server, { path: "/websocket" }) as SocketServer;
  (globalThis as ExtendedGlobal)[GlobalThisSocketServer] = socketServer;
};
