import type {
  SocketServer
} from "$lib/types";
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { CSRF_HEADER } from "../../constants";
import { inspect } from "node:util";

export const GlobalThisSocketServer = Symbol.for("sveltekit.socket.io");

export const createSocketServer = (server: HttpServer | null) => {
  if (!server) return;
  const socketServer = new Server(server, { path: "/websocket" }) as SocketServer;
  (globalThis as ExtendedGlobal)[GlobalThisSocketServer] = socketServer;

  socketServer.on("connection", (socket) => {
    console.log(inspect(socket, false, null, true));
    const csrfHeader = socket.request.headers[CSRF_HEADER.toLowerCase()];
    if (!csrfHeader) {
      socket.emit("error", "No csrf header!");
      socket.disconnect(true);
    }
    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
};

export type ExtendedGlobal = typeof globalThis & { [GlobalThisSocketServer]: SocketServer };
