import { Insertable, Selectable, Updateable } from "kysely";
import { Auth, Chat, DB, Message, Participant, Role, User } from "./db-types.js";

type UpdateType<T = DB[keyof DB]> = Omit<Updateable<T>, BaseTableColumns>;

export type BaseDateColumns = "createdAt" | "updatedAt";
export type BaseTableColumns = BaseDateColumns | "id";
export type UserDto = Selectable<User>;
export type CreateUserDto = Omit<Insertable<User> & Insertable<Auth>, BaseTableColumns>;
export type UpdateUserDto = UpdateType<User>;
export type AuthDto = Selectable<Auth>;
export type UpdateAuthDto = Required<UpdateType<Auth>>;
export type RoleDto = Selectable<Role>;
export type ChatDto = Selectable<Chat>;
export type MessageDto = Selectable<Message>;
export type ParticipantDto = Selectable<Participant>;
