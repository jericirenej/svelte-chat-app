import { Selectable } from "kysely";
import { Auth, Chat, Message, Participant, Role, User } from "./db-types.js";

export type BaseDateColumns = "createdAt" | "updatedAt";
export type BaseTableColumns = BaseDateColumns | "id";
export type UserDto = Selectable<User>;
export type AuthDto = Selectable<Auth>;
export type RoleDto = Selectable<Role>;
export type ChatDto = Selectable<Chat>;
export type MessageDto = Selectable<Message>;
export type ParticipantDto = Selectable<Participant>;
