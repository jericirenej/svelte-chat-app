import type { Server, Socket as ServerSocket } from "socket.io";
import type { Socket } from "socket.io-client";
import type { GlobalThisSocketServer } from "../constants";
import type { MessageDto } from "@db/postgres";
import type { ParticipantData } from "../types";
export type UsersTypingArgs = { userId: string; chatId: string; status: boolean };

export type ServerToClientEvents = {
  participantOnline: (username: string, online: boolean) => void;
  sessionExpirationWarning: () => void;
  error: (a: string) => void;
  messagePush: (message: MessageDto) => void;
  userTyping: (arg: UsersTypingArgs) => void;
  participantLeftChat: (chatId: string, participantId: string) => void;
  chatCreated: (chatId: string, chatLabel: string, participants: ParticipantData[]) => void;
};

export type ClientToServerEvents = {
  messagePush: (message: MessageDto) => void;
  userTyping: (arg: UsersTypingArgs) => void;
  participantLeftChat: (chatId: string, participantId: string) => void;
  chatCreated: (chatId: string, chatLabel: string, participants: ParticipantData[]) => void;
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
