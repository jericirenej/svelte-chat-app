/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql, type Kysely } from "kysely";

export const up = async (db: Kysely<any>): Promise<void> => {
  const createExtension = sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await db.executeQuery(createExtension.compile(db));

  await db.schema
    .createTable("user")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("email", "varchar(100)", (col) => col.notNull())
    .addColumn("name", "varchar(100)")
    .addColumn("surname", "varchar(100)")
    .addColumn("username", "varchar(100)", (col) => col.notNull().unique())
    .addColumn("avatar", "varchar(100)", (col) => col.notNull())
    .addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable("auth")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().references("user.id").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("hash", "varchar", (col) => col.notNull())
    .addColumn("salt", "varchar", (col) => col.notNull())
    .addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable("contact")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("userId", "uuid", (col) =>
      col.notNull().references("user.id").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("contactId", "uuid", (col) =>
      col.notNull().references("user.id").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema.createType("userRoles").asEnum(["admin", "user"]).execute();
  await db.schema
    .createTable("role")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().references("user.id").onDelete("cascade").onUpdate("cascade")
    )
    .addColumn("role", sql`user_roles`, (col) => col.notNull())
    .addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable("chat")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("public", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable("message")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("userId", "uuid", (col) =>
      col.notNull().references("user.id").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("chatId", "uuid", (col) =>
      col.notNull().references("chat.id").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex("message_chat_id_unique_index")
    .on("message")
    .column("chatId")
    .execute();

  await db.schema
    .createTable("participant")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("chatId", "uuid", (col) =>
      col.notNull().references("chat.id").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("userId", "uuid", (col) =>
      col.notNull().references("user.id").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();
  await db.schema
    .createIndex("participant_chat_and_user")
    .on("participant")
    .columns(["id", "userId"])
    .execute();
};

export const down = async (db: Kysely<any>): Promise<void> => {
  for (const table of [
    "message",
    "participant",
    "chat",
    "contact",
    "auth",
    "role",
    "user"
  ] as const) {
    await db.schema.dropTable(table).execute();
  }
  await db.schema.dropType("userRoles").execute();
};
