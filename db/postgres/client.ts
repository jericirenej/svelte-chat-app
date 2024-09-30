import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { DB } from "./db-types.js";
const { Pool } = pg;
const env = await import("../environment.js").then((i) => i.default);
export const dialect = new PostgresDialect({
  pool: new Pool({
    database: env.POSTGRES_DB,
    host: env.POSTGRES_HOST,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    port: env.POSTGRES_PORT | 5432
  })
});
export const db = new Kysely<DB>({
  dialect,
  plugins: [new CamelCasePlugin()]
});
