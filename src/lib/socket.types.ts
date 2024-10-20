import type { Server, Socket as ServerSocket } from "socket.io";
import type { Socket } from "socket.io-client";
import type { GlobalThisSocketServer } from "../constants";
import type { MessageDto } from "@db/postgres";
export type ServerToClientEvents = {
  basicEmit: (a: string) => void;
  participantOnline: (username: string, online: boolean) => void;
  sessionExpirationWarning: () => void;
  error: (a: string) => void;
  messagePush: (message: MessageDto) => void;
  userTyping: (arg: { userId: string; chatId: string; status: boolean }) => void;
};

export type ClientToServerEvents = {
  hello: () => void;
  messagePush: (message: MessageDto) => void;
  userTyping: (arg: { userId: string; chatId: string; status: boolean }) => void;
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

export type SocketServer_Socket = ServerSocket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type SocketClient = Socket<ServerToClientEvents, ClientToServerEvents>;
export type ExtendedGlobal = typeof globalThis & {
  [GlobalThisSocketServer]: SocketServer | undefined;
};
