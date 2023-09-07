import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type UserRoles = "admin" | "user";

export interface Auth {
  id: string;
  hash: string;
  salt: string;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface Chat {
  id: string;
  name: string;
  public: Generated<boolean>;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface Contact {
  id: Generated<string>;
  userId: string;
  contactId: string;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface Message {
  id: string;
  userId: string;
  chatId: string;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface Participant {
  id: string;
  chatId: string;
  userId: string;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface Role {
  id: string;
  role: UserRoles;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface User {
  id: Generated<string>;
  email: string;
  name: string | null;
  surname: string | null;
  username: string;
  avatar: string;
  createdAt: Generated<Timestamp>;
  updatedAt: Generated<Timestamp>;
}

export interface DB {
  auth: Auth;
  chat: Chat;
  contact: Contact;
  message: Message;
  participant: Participant;
  role: Role;
  user: User;
}
