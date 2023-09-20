import { CamelCasePlugin, Kysely, Migrator } from "kysely";
import { dialect } from "../client.js";
import { ESMFileMigrationProvider, MigrationHelper } from "./migrator.js";

const MIGRATIONS_PATH_RELATIVE = new URL("../migrations", import.meta.url),
  TYPE_PATH = new URL("../db-types.ts", import.meta.url).pathname.substring(1),
  db = new Kysely<unknown>({ dialect, log: ["query"], plugins: [new CamelCasePlugin()] }),
  migrator = new Migrator({ db, provider: new ESMFileMigrationProvider(MIGRATIONS_PATH_RELATIVE) });

const migrationHelper = new MigrationHelper(db, migrator, TYPE_PATH);
await migrationHelper.handleArgs(process.argv);
