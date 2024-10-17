import type { Insertable, Selectable, Updateable } from "kysely";
import type { Admin, Auth, Chat, DB, Message, Participant, User } from "./db-types.js";

type UpdateType<T = DB[keyof DB]> = Omit<Updateable<T>, BaseTableColumns>;

export type BaseDateColumns = "createdAt" | "updatedAt";
export type BaseTableColumns = BaseDateColumns | "id";
export type UserRole = "superAdmin" | "admin" | "user";

export type UserDto = Selectable<User>;
export type CompleteUserDto = UserDto & { role: UserRole };
export type CreateUserDto = Omit<Insertable<User> & Insertable<Auth>, BaseTableColumns>;
export type UpdateUserDto = UpdateType<User>;
export type SingleUserSearch = { property: "id" | "username" | "email"; value: string };

export type AuthDto = Selectable<Auth>;
export type UpdateAuthDto = Required<UpdateType<Auth>>;

export type AdminDto = Selectable<Admin>;

export type MessageDto = Selectable<Message>;
export type MessagesDto = { messages: MessageDto[]; total: number };
export type CreateMessageDto = Omit<Insertable<Message>, BaseTableColumns>;
export type ParticipantDto = Selectable<Participant>;

export type ChatDto = Selectable<Chat>;
export type CreateChatDto = Omit<Insertable<Chat>, BaseTableColumns> & {
  participants: string[];
};
export type ChatUserDto = Omit<User, BaseDateColumns | "email" | "id"> & { id: string };
export type GetChatDto = ChatDto & {
  participants: ChatUserDto[];
  messages: MessageDto[];
  totalMessages: number;
};

export type ChatOrderProperties = {
  property: "name" | "createdAt" | "message" | "participants";
  direction: "asc" | "desc";
};
export type GetChatsDto = { chatIds: string | string[] } & Partial<ChatOrderProperties>;

type SingleOne<T> = T extends infer S ? { [K in keyof S]: S[K] } : never;
type NoneOf<T> = SingleOne<{ [K in keyof T]?: never }>;

export type XOR<T> =
  | NoneOf<T>
  | { [K in keyof T]: SingleOne<Pick<T, K>> & NoneOf<Omit<T, K>> }[keyof T];
