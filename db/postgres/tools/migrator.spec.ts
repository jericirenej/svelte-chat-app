/* eslint-disable @typescript-eslint/no-unused-vars */
import { copyFile } from "fs/promises";
import { Kysely, MigrationInfo, MigrationResultSet, Migrator, NoMigrations } from "kysely";
import { SpyInstance, afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MigrationHelper } from "./migrator.js";
import * as utils from "./utils.js";

vi.mock("fs/promises", () => ({
  copyFile: vi.fn().mockImplementation((...args: unknown[]) => Promise.resolve())
}));

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
  let migrator: MigrationHelper,
    spyOnLog: SpyInstance,
    spyOnWarn: SpyInstance,
    spyOnUpdate: SpyInstance;
  const mockMigrator = new MockMigrator() as unknown as Migrator,
    typePath = "path/to/type.ts",
    db = { destroy: () => Promise.resolve() } as Kysely<unknown>,
    time = 123456789,
    migrationName = "MigrationName",
    expectedMigration = `migrations/${time}-${migrationName}.ts`;
  vi.useFakeTimers();
  vi.setSystemTime(time);

  beforeEach(() => {
    migrator = new MigrationHelper(db, mockMigrator, typePath);
    spyOnUpdate = vi
      .spyOn(utils, "asyncExec")
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .mockImplementation((message: string) => Promise.resolve({ stderr: null, stdout: null }));
    [spyOnLog, spyOnWarn] = (["log", "warn"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation((...arg: unknown[]) => {})
    );
  });
  afterEach(() => {
    [spyOnLog, spyOnWarn, spyOnUpdate].forEach((spy) => {
      spy.mockRestore();
    });
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });
  it("Instance should be defined", () => {
    expect(migrator).toBeTruthy();
  });
  it("Update schema should call kysely-codegen with appropriate arguments", async () => {
    const expected = `npx kysely-codegen --camel-case --print true --dialect postgres --out-file ${typePath}`;
    await migrator.updateSchema();
    expect(spyOnUpdate).toHaveBeenLastCalledWith(expected);
    spyOnUpdate.mockRestore();
  });
  it("closeConnection should call db.destroy", async () => {
    const spyOnDestroy = vi.spyOn(db, "destroy");
    await migrator.closeConnection();
    expect(spyOnDestroy).toHaveBeenCalledOnce();
  });
  it("Calling handleArgs with 'create' keyword and migration name should create migration", async () => {
    const spyOnCopy = vi.mocked(copyFile);
    const fullArgs = ["", "", "create", migrationName];
    const testCases: { args: string[]; pass: boolean }[] = [
      { args: fullArgs, pass: true },
      { args: fullArgs.slice(-1), pass: false },
      { args: fullArgs.slice(-2), pass: false }
    ];
    for (const { args, pass } of testCases) {
      spyOnCopy.mockClear();
      await migrator.handleArgs(args);
      if (!pass) {
        expect(spyOnCopy).not.toHaveBeenCalled();
        continue;
      }
      expect(spyOnCopy).toHaveBeenCalledOnce();
      const [templateUrl, targetUrl] = spyOnCopy.mock.lastCall as [URL, URL];
      expect(/migration-template.ts$/.test(templateUrl.pathname)).toBe(true);
      const regex = new RegExp(`/${expectedMigration}$`);
      expect(regex.test(targetUrl.pathname)).toBe(true);
    }
  });
  it("Migration args should result in appropriate migrations method calls", async () => {
    const spies = new Map<keyof Migrator, SpyInstance>([
      ["getMigrations", vi.spyOn(mockMigrator, "getMigrations")],
      ["migrateDown", vi.spyOn(mockMigrator, "migrateDown")],
      ["migrateUp", vi.spyOn(mockMigrator, "migrateUp")],
      ["migrateTo", vi.spyOn(mockMigrator, "migrateTo")],
      ["migrateToLatest", vi.spyOn(mockMigrator, "migrateToLatest")]
    ]);
    const testCases: { args: string[]; targetMethod: (keyof Migrator)[] }[] = [
      { args: ["migrate"], targetMethod: ["migrateToLatest"] },
      { args: ["up"], targetMethod: ["migrateUp"] },
      { args: ["down"], targetMethod: ["migrateDown"] },
      { args: ["clear"], targetMethod: ["migrateTo"] },
      { args: ["reset"], targetMethod: ["migrateTo", "migrateToLatest"] },
      { args: ["to"], targetMethod: [] },
      { args: ["to", migrationName], targetMethod: ["migrateTo"] },
      { args: [], targetMethod: [] }
    ];

    for (const { args, targetMethod } of testCases) {
      spies.forEach((spy) => spy.mockClear());
      await migrator.handleArgs(["command", "script", ...args]);
      const nonCalled = [...spies.keys()].filter((key) => !targetMethod.includes(key));
      nonCalled.forEach((method) => {
        expect(spies.get(method)).not.toHaveBeenCalled();
      });
      targetMethod.forEach((method) => {
        expect(spies.get(method)).toHaveBeenCalled();
      });
    }
  });
});
