import { CamelCasePlugin, Kysely, Migrator, PostgresDialect } from "kysely";
import pg from "pg";
import env from "../../environment.js";
import type { DB } from "../db-types.js";
import { ESMFileMigrationProvider, MigrationHelper } from "./migrator.js";
const postgresConnection = {
  database: env.POSTGRES_POSTGRES_DB,
  host: env.POSTGRES_HOST,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  port: env.POSTGRES_PORT | 5432
};

const TEST_DB_NAME = "test_db";
const MIGRATIONS_PATH = new URL("../migrations", import.meta.url),
  TYPE_PATH = new URL("../db-types.ts", import.meta.url).pathname.substring(1);

export const createOrDestroyTempDb = async (
  action: "create" | "destroy" = "create",
  dbName = TEST_DB_NAME
): Promise<void> => {
  const { Client } = pg;
  const postgresClient = new Client(postgresConnection);
  await postgresClient.connect();
  await postgresClient.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
  if (action === "create") {
    await postgresClient.query(`CREATE DATABASE "${dbName}"`);
  }
  await postgresClient.end();
};

export const createDbConnectionAndMigrator = (dbName = TEST_DB_NAME, log = false) => {
  const { Pool } = pg;
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({ ...postgresConnection, database: dbName })
    }),
    log: log ? ["query", "error"] : [],
    plugins: [new CamelCasePlugin()]
  });
  const migrationHelper = new MigrationHelper(
    db as Kysely<unknown>,
    new Migrator({ db, provider: new ESMFileMigrationProvider(MIGRATIONS_PATH) }),
    TYPE_PATH
  );
  return { db, migrationHelper };
};
