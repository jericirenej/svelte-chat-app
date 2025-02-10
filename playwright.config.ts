import { devices, type PlaywrightTestConfig } from "@playwright/test";

export const WORKERS = 8,
  BASE_PORT = 5174;

const config: PlaywrightTestConfig = {
  globalSetup: "./tests/global.setup",
  globalTeardown: "./tests/global.teardown",
  testDir: "tests",
  workers: WORKERS,
  retries: 1,
  fullyParallel: true,
  timeout: 1e4,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chromium" } }],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.05 } },
  testMatch: /(.+\.)?spec\.ts/,

  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure"
  }
};

export default config;
