import * as dotenv from "dotenv";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { DB } from "./db-types.js";

dotenv.configDotenv({ path: new URL("../../.env", import.meta.url).pathname.substring(1) });

const { Pool } = pg;
export const dialect = new PostgresDialect({
  pool: new Pool({
    database: "chat",
    host: process.env["POSTGRES_HOST"],
    user: process.env["POSTGRES_USER"],
    password: process.env["POSTGRES_PASSWORD"],
    port: Number(process.env["POSTGRES_PORT"]) | 5432
  })
});

export const db = new Kysely<DB>({ dialect, log: ["query"], plugins: [new CamelCasePlugin()] });
