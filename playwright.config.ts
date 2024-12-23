import { devices, type PlaywrightTestConfig } from "@playwright/test";

export const WORKERS = 4,
  BASE_PORT = 5174;

const config: PlaywrightTestConfig = {
  globalSetup: "./tests/global.setup",
  globalTeardown: "./tests/global.teardown",
  testDir: "tests",
  workers: WORKERS,
  retries: 1,
  timeout: 15e3,
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chromium" } }
    /* { name: "firefox", use: { ...devices["Desktop Firefox"] } } */
    /*     { name: "safari", use: { ...devices["Desktop Safari"] } } */
  ],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.05 } },
  testMatch: /(.+\.)?spec\.ts/,
  reporter: [["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure"
  }
};

export default config;
