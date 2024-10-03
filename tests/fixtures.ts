/* eslint-disable no-empty-pattern */
import { test as base } from "@playwright/test";
import type { DatabaseService } from "@db/postgres/db-service";
import { BASE_PORT, WORKERS } from "../playwright.config";
import { dbName, e2eDatabases } from "./utils";

type CustomFixtures = {
  dbService: DatabaseService;
  clearDB: () => Promise<void>;
  seedDB: () => Promise<void>;
  seedAll: () => Promise<void>;
};

export const test = base.extend<CustomFixtures>({
  dbService: async ({}, use) => {
    await use(await e2eDatabases.dbService(dbName(base.info())));
  },
  seedAll: async ({}, use) => {
    const seedAll = async () => {
      await Promise.all(
        Array.from(Array(WORKERS), (_, i) => i + 1).map(async (i) => {
          await e2eDatabases.seedDbDispose(dbName(i));
        })
      );
    };
    await use(seedAll);
  },
  clearDB: async ({}, use) => {
    const clearDb = () => e2eDatabases.clearDB(dbName(base.info()));
    await use(clearDb);
  },
  seedDB: async ({}, use) => {
    const seedDb = () => e2eDatabases.seedDbDispose(dbName(base.info()));
    await use(seedDb);
  },

  baseURL: async ({}, use) => {
    await use(`http://localhost:${BASE_PORT + base.info().parallelIndex}`);
  }
});
