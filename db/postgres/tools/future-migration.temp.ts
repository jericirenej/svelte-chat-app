import { sql } from "kysely";
import { db } from "../client.js";

await db.schema
  .createTable("contact")
  .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
  .addColumn("userId", "uuid", (col) =>
    col.notNull().references("user.id").onUpdate("cascade").onDelete("cascade")
  )
  .addColumn("contactId", "uuid", (col) =>
    col.notNull().references("user.id").onUpdate("cascade").onDelete("cascade")
  )
  .addColumn("confirmed", "boolean", (col) => col.notNull().defaultTo(false))
  .addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
  .addColumn("updatedAt", "timestamp", (col) => col.notNull().defaultTo(sql`NOW()`))
  .addUniqueConstraint("unique_user_name_and_contact", ["userId", "contactId"])
  .execute();
