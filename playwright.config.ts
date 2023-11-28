import { devices, type PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  webServer: {
    command: "npm run build && npm run preview",
    port: 4173
  },
  globalSetup: "./tests/global.setup",
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
    },
    {
      name: "safari",
      use: { ...devices["Desktop Safari"] }
    }
  ],
  testMatch: /(.+\.)?(test|spec)\.[jt]s/
};

export default config;
