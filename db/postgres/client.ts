import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import env from "../helpers/get-env.js";
import type { DB } from "./db-types.js";

const { Pool } = pg;
export const dialect = new PostgresDialect({
  pool: new Pool({
    database: "chat",
    host: env["POSTGRES_HOST"],
    user: env["POSTGRES_USER"],
    password: env["POSTGRES_PASSWORD"],
    port: Number(env["POSTGRES_PORT"]) | 5432
  })
});

export const db = new Kysely<DB>({
  dialect,
  plugins: [new CamelCasePlugin()]
});
