import { CamelCasePlugin, Kysely, Migrator, PostgresDialect } from "kysely";
import { Client, Pool } from "pg";
import env from "../../environment.js";
import { DB } from "../db-types.js";
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
  action: "create" | "destroy" = "create"
): Promise<void> => {
  const postgresClient = new Client(postgresConnection);
  await postgresClient.connect();
  await postgresClient.query(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE)`);
  if (action === "create") {
    await postgresClient.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
  }
  await postgresClient.end();
};

export const createDbConnectionAndMigrator = () => {
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({ ...postgresConnection, database: TEST_DB_NAME })
    }),
    plugins: [new CamelCasePlugin()]
  });
  const migrationHelper = new MigrationHelper(
    db as Kysely<unknown>,
    new Migrator({ db, provider: new ESMFileMigrationProvider(MIGRATIONS_PATH) }),
    TYPE_PATH
  );
  return { db,migrationHelper };
};
