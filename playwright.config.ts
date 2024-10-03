import { devices, type PlaywrightTestConfig } from "@playwright/test";

export const WORKERS = 4,
  BASE_PORT = 5173;

const config: PlaywrightTestConfig = {
  globalSetup: "./tests/global.setup",
  globalTeardown: "./tests/global.teardown",
  testDir: "tests",
  workers: WORKERS,
  retries: 1,
  timeout: 15e3,
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"] } }],

  testMatch: /(.+\.)?spec\.ts/
};

export default config;
