import { CamelCasePlugin, Kysely, Migrator, PostgresDialect, sql } from "kysely";
import pg from "pg";
import { BlobStorageService } from "../../blob/blob.storage.service.js";
import env from "../../environment.js";
import { DatabaseService } from "../db-service.js";
import type { DB } from "../db-types.js";
import { seed as defaultSeed, users } from "../seed/default-seed.js";
import type { ChatSchema, CreateUserArg } from "../seed/seed.js";
import { Seeder } from "../seed/seed.js";
import { ESMFileMigrationProvider, MigrationHelper } from "./migrator.js";
const postgresConnection = {
  database: env.POSTGRES_POSTGRES_DB,
  host: env.POSTGRES_HOST,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  port: env.POSTGRES_PORT | 5432
};
type PostgresConnection = typeof postgresConnection;

const MIGRATIONS_PATH = new URL("../migrations", import.meta.url),
  TYPE_PATH = new URL("../db-types.ts", import.meta.url).pathname.substring(1);

export type SeedSchema<T extends string = string> = {
  // If no users provided, default set will be used
  users?: CreateUserArg[];
  chats?: ChatSchema<T>[];
};

export class TestingDatabases {
  postgres: Kysely<unknown>;
  DBs: Map<string, Kysely<DB>> = new Map();
  blobServices: Map<string, BlobStorageService> = new Map();

  constructor(
    private config: PostgresConnection = postgresConnection,
    private log = false
  ) {
    this.postgres = this.createKyselyClient<unknown>("postgres");
  }

  async createTestDB(dbName: string): Promise<Kysely<DB>> {
    const db = this.createKyselyClient<DB>(dbName);
    this.DBs.set(dbName, db);
    this.blobServices.set(dbName, new BlobStorageService(dbName));
    await this.createDB(dbName);
    await this.runMigrateAction(dbName, "migrateToLatest");
    return db;
  }

  getDB(dbName: string) {
    return this.DBs.get(dbName) ?? this.createKyselyClient(dbName);
  }

  getBlobService(dbName: string) {
    return this.blobServices.get(dbName) ?? new BlobStorageService(dbName);
  }

  getDbAndBlob(dbName: string) {
    return { db: this.getDB(dbName), blobService: this.getBlobService(dbName) };
  }

  async clearDB(dbName: string): Promise<void> {
    const { db, blobService } = this.getDbAndBlob(dbName);
    await db.deleteFrom("user").execute();
    await db.deleteFrom("chat").execute();
    await blobService.clearBucket();
  }

  async clearDbDispose(dbName: string): Promise<void> {
    await using kyselyDB = this.createKyselyClientDispose<DB>(dbName);
    await kyselyDB.db.deleteFrom("user").execute();
    await kyselyDB.db.deleteFrom("chat").execute();
    await this.getBlobService(dbName).clearBucket();
  }
  async seedDbDispose(dbName: string, schema?: SeedSchema): Promise<void> {
    await using kyselyDb = this.createKyselyClientDispose<DB>(dbName);
    await this.seed(kyselyDb.db, this.getBlobService(dbName), schema);
  }

  async dbService(dbName: string): Promise<DatabaseService> {
    await using service = new DatabaseService(this.getDB(dbName));
    return service;
  }

  async resetDB(dbName: string) {
    await this.runMigrateAction(dbName, "reset");
  }

  async seedDB(dbName: string): Promise<void> {
    await this.seed(this.getDB(dbName), this.getBlobService(dbName));
  }

  private createKyselyClient<T>(dbName: string): Kysely<T> {
    const { Pool } = pg;
    const db = new Kysely<T>({
      dialect: new PostgresDialect({
        pool: new Pool({ ...this.config, database: dbName })
      }),

      log: this.log ? ["query", "error"] : [],
      plugins: [new CamelCasePlugin()]
    });
    return db;
  }

  private createKyselyClientDispose<T>(dbName: string) {
    const db = this.createKyselyClient<T>(dbName);
    return {
      db,
      [Symbol.asyncDispose]: async () => {
        await db.destroy();
      }
    };
  }

  /** Executes default seed if no schema provided.
   * Otherwise, performs seed with provided schema */
  protected async seed(db: Kysely<DB>, blobService: BlobStorageService, schema?: SeedSchema) {
    if (!schema) {
      await defaultSeed({ db, blobService, shouldLog: this.log });
      return;
    }
    const seeder = new Seeder({ db, blobService, shouldLog: this.log });
    await seeder.clearDb();
    await seeder.createUsers(schema.users?.length ? schema.users : users);
    if (schema.chats?.length) {
      await seeder.createChats<string>(schema.chats);
    }
  }

  private async createDB(name: string): Promise<void> {
    await this.forceDrop(name);

    await sql`CREATE DATABASE ${sql.ref(name)}`.execute(this.postgres);
    await this.getBlobService(name).createBucket();
  }

  private async forceDrop(name: string): Promise<void> {
    await sql`DROP DATABASE IF EXISTS ${sql.ref(name)} WITH (FORCE)`.execute(this.postgres);
    await this.getBlobService(name).trashBucket();
  }

  private async runMigrateAction(
    dbName: string,
    action: "migrateToLatest" | "reset"
  ): Promise<void> {
    await using kysely = this.createKyselyClientDispose(dbName);
    await new MigrationHelper(
      new Migrator({ db: kysely.db, provider: new ESMFileMigrationProvider(MIGRATIONS_PATH) }),
      TYPE_PATH
    )[action]();
  }

  async cleanup(removeDBs = true) {
    for (const [name, db] of [...this.DBs.entries()]) {
      await db.destroy();
      if (!removeDBs) return;
      await this.getBlobService(name).trashBucket();
      await this.forceDrop(name);
    }
    await this.postgres.destroy();
  }
}
