import type { Server } from "socket.io";
import type { Socket } from "socket.io-client";
import type { GlobalThisSocketServer } from "../constants";
export type ServerToClientEvents = {
  noArg: () => void;
  basicEmit: (a: string) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
  error: (a: string) => void;
};

export type ClientToServerEvents = {
  hello: () => void;
};

export type InterServerEvents = {
  ping: () => void;
};

export type SocketData = {
  name: string;
  age: number;
};

export type SocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type SocketClient = Socket<ServerToClientEvents, ClientToServerEvents>;
export type ExtendedGlobal = typeof globalThis & { [GlobalThisSocketServer]: SocketServer };