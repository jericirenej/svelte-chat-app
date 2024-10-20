import type { MessagesDto, UserDto } from "@db/postgres";
import type { ChatPreviewProp } from "./components/organic/ChatPreviewList/types";

export type PbkdfSettings = {
  iterations: number;
  keylen: number;
  randomBytesLength: number;
  digest: string;
  toStringType: BufferEncoding;
};

export type RemoveIndexSignature<T extends Record<string, unknown>> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};
export type NotificationTypes = "default" | "secondary" | "failure";
export type NotificationEntry = {
  content: string;
  action?: () => unknown;
  type?: NotificationTypes;
  lifespan?: number;
};

export type MaybeArray<T> = T | T[];
export type Nullish = undefined | null;

export type ActionTypes = "confirm" | "cancel" | "danger" | "info";

export type EntitySize = "xs" | "sm" | "base" | "lg" | "xl" | number;
export type Entity = { name: string; avatar: string | Nullish; id: string };
export type LayoutChatData = ChatPreviewProp & {
  totalMessages: number;
  unreadMessages: number;
};
export type LayoutChatStore = Omit<LayoutChatData, "unreadMessages">;
export type ParticipantData = Omit<UserDto, "email" | "createdAt" | "updatedAt">;
export type SingleChatData = {
  participants: ParticipantData[];
} & MessagesDto;
