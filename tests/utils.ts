import type { BrowserContext, Locator, Page, TestInfo } from "@playwright/test";
import { redisService } from "../db/index.js";
import { USERS, type AvailableUsers } from "../db/postgres/seed/seed.js";
import { TestingDatabases } from "../db/postgres/tools/testing-db-helper.js";
import { LOGIN_ROUTE, ROOT_ROUTE, SESSION_COOKIE } from "../src/constants.js";
import { LOGIN_MESSAGES } from "../src/messages.js";

const defaultUser: AvailableUsers = "lovelace",
  defaultPassword: `${AvailableUsers}-password` = "lovelace-password";

export const userHashMap = USERS.reduce(
  (acc, curr) => {
    acc[curr.username] = curr;
    return acc;
  },
  {} as Record<AvailableUsers, (typeof USERS)[number]>
);

export const cleanup = async (context: BrowserContext): Promise<void> => {
  const cookies = await context.cookies();
  const sessionCookie = cookies.filter(({ name }) => name === SESSION_COOKIE);
  if (sessionCookie[0]) {
    await redisService.deleteSession(sessionCookie[0].value);
  }
};

export const clickAndFillLocator = async (locator: Locator, val: string): Promise<void> => {
  await locator.click({ delay: 30 });
  await locator.fill(val);
  await locator.press("Tab");
};

export const login = async (
  page: Page,
  user: string = defaultUser,
  password: string = defaultPassword,
  waitForRoot = true
): Promise<void> => {
  if (!page.url().includes("login")) {
    await page.goto(LOGIN_ROUTE);
  }
  await page.waitForURL(LOGIN_ROUTE);
  await page.waitForLoadState("networkidle");
  const userField = page.getByPlaceholder(LOGIN_MESSAGES.usernamePlaceholder),
    passwordField = page.getByPlaceholder(LOGIN_MESSAGES.passwordPlaceholder);
  for (const [field, val] of [
    [userField, user],
    [passwordField, password]
  ] as const) {
    await clickAndFillLocator(field, val);
  }
  const button = page.getByRole("button", { name: "SUBMIT" });
  await button.click();
  if (waitForRoot) {
    await page.waitForURL(ROOT_ROUTE);
  }
};

export const typedObjectKeys = <T extends Record<string, unknown>>(arg: T): (keyof T)[] =>
  Object.keys(arg);

export const e2eDatabases = new TestingDatabases();
export const dbName = (info: TestInfo | number) =>
  `chat_test_${typeof info === "number" ? info : info.parallelIndex + 1}`;
