import { devices, type PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  webServer: {
    command: "npm run build && npm run preview",
    port: 4173
  },
  testDir: "tests",
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
      name: "galaxy",
      use: { ...devices["Galaxy S III"] }
    }
  ],
  testMatch: /(.+\.)?(test|spec)\.[jt]s/
};

export default config;
