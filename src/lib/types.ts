import type { Server } from "socket.io";
import type { Socket } from "socket.io-client";
export type ServerToClientEvents = {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
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
