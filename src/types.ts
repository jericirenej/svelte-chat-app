import type { MessagesDto, UserDto } from "@db/postgres";
import type { ChatPreviewProp } from "./components/organisms/ChatPreviewList/types";

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
export type Maybe<T> = T | Nullish;
export type ExcludeNullish<Obj extends object> = { [Key in keyof Obj]: Exclude<Obj[Key], Nullish> };

export type ActionTypes = "confirm" | "cancel" | "danger" | "info";

export type EntitySize = "xs" | "sm" | "base" | "lg" | "xl" | number;
export type Entity = { name: string; avatar: string | Nullish; id: string };
export type LayoutChatData = ChatPreviewProp & {
  participants: ParticipantData[];
  totalMessages: number;
  unreadMessages: number;
};

export type LayoutChats = Omit<LayoutChatData, "unreadMessages">;
export type UnreadChatMessages = Record<string, number>;
export type UserChats = Record<string, SingleChatData | undefined>;
export type UsersTyping = Record<
  string,
  { list: Set<string>; label: string | undefined } | undefined
>;

export type ParticipantData = Omit<UserDto, "email" | "createdAt" | "updatedAt">;
export type SingleChatData = {
  participants: ParticipantData[];
} & MessagesDto;
