import { devices, type PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:4173",
  },
  globalSetup: "./tests/global.setup",
  globalTeardown: "./tests/global.teardown",
  testDir: "tests",
  retries: 3,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] }
    }
  ],
  use: {
    baseURL:"http://localhost:4173"
  },
  testMatch: /(.+\.)?(test|spec)\.[jt]s/
};

export default config;
