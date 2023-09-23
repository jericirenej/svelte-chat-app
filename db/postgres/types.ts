import { Insertable, Selectable, Updateable } from "kysely";
import { Admin, Auth, Chat, DB, Message, Participant, User } from "./db-types.js";

type UpdateType<T = DB[keyof DB]> = Omit<Updateable<T>, BaseTableColumns>;

export type BaseDateColumns = "createdAt" | "updatedAt";
export type BaseTableColumns = BaseDateColumns | "id";

export type UserDto = Selectable<User>;
export type CreateUserDto = Omit<Insertable<User> & Insertable<Auth>, BaseTableColumns>;
export type UpdateUserDto = UpdateType<User>;
export type SingleUserSearch = { property: "id" | "username" | "email"; value: string };

export type AuthDto = Selectable<Auth>;
export type UpdateAuthDto = Required<UpdateType<Auth>>;

export type AdminDto = Selectable<Admin>;

export type MessageDto = Selectable<Message>;
export type ParticipantDto = Selectable<Participant>;

export type ChatDto = Selectable<Chat>;
export type CreateChatDto = Omit<Insertable<Chat>, BaseTableColumns> & {
  participants: string[];
};
export type GetChatDto = ChatDto & { participants: string[]; messages: MessageDto[] };

export type ChatOrderProperties = {
  property: "name" | "createdAt" | "message" | "participants";
  direction: "asc" | "desc";
};
export type GetChatsDto = { chatIds: string | string[] } & Partial<ChatOrderProperties>;
