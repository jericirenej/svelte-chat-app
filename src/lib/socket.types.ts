import type { Server } from "socket.io";
import type { Socket } from "socket.io-client";
import type { GlobalThisSocketServer } from "../constants";
export type ServerToClientEvents = {
  basicEmit: (a: string) => void;
  participantOnline: (username:string, online:boolean) => void;
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
export type ExtendedGlobal = typeof globalThis & { [GlobalThisSocketServer]: SocketServer | undefined };