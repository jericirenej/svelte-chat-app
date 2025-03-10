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
    .addColumn("avatar", "varchar")
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable("auth")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().references("user.id").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("hash", "varchar", (col) => col.notNull())
    .addColumn("salt", "varchar", (col) => col.notNull())
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable("admin")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().references("user.id").onDelete("cascade").onUpdate("cascade")
    )
    .addColumn("superAdmin", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable("chat")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("name", "varchar(100)")
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createTable("message")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("userId", "uuid", (col) =>
      col.notNull().references("user.id").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("chatId", "uuid", (col) =>
      col.notNull().references("chat.id").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("message", "varchar", (col) => col.notNull())
    .addColumn("deleted", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex("message_chat_id_unique_index")
    .on("message")
    .column("chatId")
    .execute();

  await db.schema
    .createTable("participant")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("chatId", "uuid", (col) =>
      col.notNull().references("chat.id").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("userId", "uuid", (col) =>
      col.notNull().references("user.id").onUpdate("cascade").onDelete("cascade")
    )
    .addColumn("chatLastAccess", "timestamptz", (col) => col.defaultTo(null))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint("unique_participant_chat", ["userId", "chatId"])
    .execute();

  await db.schema
    .createIndex("participant_chat_and_user")
    .on("participant")
    .columns(["id", "userId"])
    .execute();
};

export const down = async (db: Kysely<any>): Promise<void> => {
  for (const table of ["message", "participant", "chat", "auth", "admin", "user"] as const) {
    await db.schema.dropTable(table).cascade().execute();
  }
};
