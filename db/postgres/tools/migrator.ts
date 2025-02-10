import { promises as fs } from "fs";
import { copyFile } from "fs/promises";
import { NO_MIGRATIONS } from "kysely";
import type { Migrator, Migration, MigrationProvider, MigrationResultSet } from "kysely";
import { join } from "path";
import { pathToFileURL } from "url";
import { asyncExec, resolveUrlPath } from "./utils.js";
import env from "../../environment.js";

export class ESMFileMigrationProvider implements MigrationProvider {
  constructor(private url: URL) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {};

    const resolvedPath = resolveUrlPath(this.url);
    const files = await fs.readdir(resolvedPath);
    for (const fileName of files) {
      if (!fileName.endsWith(".ts")) {
        continue;
      }

      const importPath = pathToFileURL(join(resolvedPath, fileName).replaceAll("\\", "/"));
      const migration = (await import(importPath.pathname)) as Migration;
      const migrationKey = fileName.substring(0, fileName.lastIndexOf("."));

      migrations[migrationKey] = migration;
    }
    return migrations;
  }
}

export type MigrationOptions = "up" | "down" | "migrate" | "to" | "clear" | "reset";
export type CompleteOptions = MigrationOptions | "create";

export class MigrationHelper {
  readonly createOption = "create";
  readonly migrationOptions: MigrationOptions[] = ["up", "down", "migrate", "to", "reset", "clear"];
  readonly optionsWithArgs = "to" as const;
  readonly skipTypeUpdateOption = "no-codegen";
  readonly noOptionsError = `Invalid options supplied! Expected one of the following: ${[
    ...this.migrationOptions,
    this.createOption
  ].join(", ")}.`;
  typePath: string;
  #evalMap = {
    migrate: this.migrateToLatest.bind(this),
    up: this.migrateUp.bind(this),
    down: this.migrateDown.bind(this),
    to: this.migrateTo.bind(this),
    clear: this.clear.bind(this),
    create: this.createMigration.bind(this),
    reset: this.reset.bind(this)
  };

  constructor(
    private migrator: Migrator,
    typePath: string
  ) {
    this.typePath = typePath;
  }

  async handleArgs(argv: string[]): Promise<void> {
    try {
      const args = argv.slice(2).map((arg) => arg.replace(/^-{1,2}/, ""));
      if (!args.length) {
        throw new Error(this.noOptionsError);
      }
      if (args.includes(this.createOption)) {
        await this.createMigration(args);
        return;
      }
      await this.handleMigration(args);
      if (!args.includes(this.skipTypeUpdateOption)) {
        await this.updateSchema();
      }
    } catch (err) {
      console.warn(err instanceof Error ? err.message : err);
    }
  }

  async updateSchema(): Promise<void> {
    const { stderr, stdout } = await asyncExec(
      `npx kysely-codegen --camel-case --dialect postgres --out-file=${this.typePath} --url="${this.dbURL}"`
    );
    if (stderr) {
      console.error(stderr);
    }
    if (stdout) {
      console.log(stdout);
    }
  }

  #resultHandler({ results, error }: MigrationResultSet): void {
    results?.forEach((result) => {
      if (result.status === "Success") {
        console.log(`migration "${result.migrationName}" was executed successfully`);
      }
      if (result.status === "Error") {
        console.error(`failed to execute migration "${result.migrationName}"`);
      }
    });

    if (error) {
      console.error("failed to migrate");
      console.error(error);
    }
  }
  protected get dbURL(): string {
    return `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;
  }

  async handleMigration(args: string[]): Promise<void> {
    const chosenOptions = this.migrationOptions.filter((option) => args.includes(option));
    if (!chosenOptions.length) {
      throw new Error(this.noOptionsError);
    }
    if (chosenOptions.length > 1) {
      throw new Error("Only one migration option allowed at a time!");
    }
    const action = chosenOptions[0];

    if (action !== this.optionsWithArgs) {
      this.#resultHandler(await this.#evalMap[action]());
      return;
    }
    // If migration requires arguments, check that we have them.
    if (args.length !== 2) {
      throw new Error("A migration name needs to be provided!");
    }

    const migrationName = args.filter((arg) => arg !== action)[0];
    this.#resultHandler(await this.#evalMap[action](migrationName));
  }

  async migrateToLatest(): Promise<MigrationResultSet> {
    return await this.migrator.migrateToLatest();
  }

  async migrateTo(migrationName: string): Promise<MigrationResultSet> {
    return await this.migrator.migrateTo(migrationName);
  }
  async migrateUp(): Promise<MigrationResultSet> {
    return await this.migrator.migrateUp();
  }
  async migrateDown(): Promise<MigrationResultSet> {
    return await this.migrator.migrateDown();
  }
  async clear(): Promise<MigrationResultSet> {
    return await this.migrator.migrateTo(NO_MIGRATIONS);
  }

  async reset(): Promise<MigrationResultSet> {
    await this.clear();
    return await this.migrateToLatest();
  }

  async createMigration(args: string[]): Promise<void> {
    try {
      const migrationArg = args.find((arg) => arg !== this.createOption);
      if (!migrationArg) throw new Error("No migration name supplied!");
      if (Number(migrationArg)) throw new Error("Please supply a string!");

      const datePrefix = Date.now();
      const migrationName = `${datePrefix}-${migrationArg}`;
      const CURRENT_DIR = import.meta.url;
      const template = new URL("./migration-template.ts", CURRENT_DIR);
      const path = new URL(`../migrations/${migrationName}.ts`, CURRENT_DIR);

      await copyFile(template, path);

      console.log("Written migration file", path.pathname);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.warn("ERROR", err.message);
        return;
      }
      console.warn("Error", err);
      return;
    }
  }
}
