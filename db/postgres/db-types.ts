import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Admin {
  createdAt: Generated<Timestamp>;
  id: string;
  superAdmin: Generated<boolean>;
  updatedAt: Generated<Timestamp>;
}

export interface Auth {
  createdAt: Generated<Timestamp>;
  hash: string;
  id: string;
  salt: string;
  updatedAt: Generated<Timestamp>;
}

export interface Chat {
  createdAt: Generated<Timestamp>;
  id: Generated<string>;
  name: string | null;
  updatedAt: Generated<Timestamp>;
}

export interface Message {
  chatId: string;
  createdAt: Generated<Timestamp>;
  deleted: Generated<boolean>;
  id: Generated<string>;
  message: string;
  updatedAt: Generated<Timestamp>;
  userId: string;
}

export interface Participant {
  chatId: string;
  chatLastAccess: Timestamp | null;
  createdAt: Generated<Timestamp>;
  id: Generated<string>;
  updatedAt: Generated<Timestamp>;
  userId: string;
}

export interface User {
  avatar: string | null;
  createdAt: Generated<Timestamp>;
  email: string;
  id: Generated<string>;
  name: string | null;
  surname: string | null;
  updatedAt: Generated<Timestamp>;
  username: string;
}

export interface DB {
  admin: Admin;
  auth: Auth;
  chat: Chat;
  message: Message;
  participant: Participant;
  user: User;
}
