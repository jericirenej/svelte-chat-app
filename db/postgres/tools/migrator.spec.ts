import { Kysely, MigrationInfo, MigrationResultSet, Migrator, NoMigrations } from "kysely";
import { beforeEach, describe, expect, it } from "vitest";
import { MigrationHelper } from "./migrator.js";

class MockMigrator {
  resultSet: MigrationResultSet = { results: [] };
  migrationInfo = {} as MigrationInfo;
  migrateToLatest(): Promise<MigrationResultSet> {
    return Promise.resolve(this.resultSet);
  }
  migrateUp(): Promise<MigrationResultSet> {
    return Promise.resolve(this.resultSet);
  }
  migrateDown(): Promise<MigrationResultSet> {
    return Promise.resolve(this.resultSet);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  migrateTo(targetMigrationName: string | NoMigrations): Promise<MigrationResultSet> {
    return Promise.resolve(this.resultSet);
  }
  getMigrations(): Promise<readonly MigrationInfo[]> {
    return Promise.resolve([this.migrationInfo]);
  }
}

describe("MigrationHelper", () => {
  let migrator: MigrationHelper;
  const mockMigrator = new MockMigrator() as unknown as Migrator,
    typePath = "path/to/type.ts",
    db = { destroy: () => Promise.resolve() } as Kysely<unknown>;

  beforeEach(() => {
    migrator = new MigrationHelper(db, mockMigrator, typePath);
  });
  it("Instance should be defined", () => {
    expect(migrator).toBeTruthy();
  });
});
