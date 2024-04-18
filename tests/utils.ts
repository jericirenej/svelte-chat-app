import type { BrowserContext, Locator, Page } from "@playwright/test";
import { redisService } from "../db/index.js";
import { USERS, type AvailableUsers } from "../db/postgres/seed/seed.js";
import { SESSION_COOKIE } from "../src/constants.js";
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

const shouldWaitForRoot = (user: string, password: string): boolean => {
  if (!(user in userHashMap)) return false;
  return password === `${user}-password`;
};

export const cleanup = async (context: BrowserContext): Promise<void> => {
  const cookies = await context.cookies();
  const sessionCookie = cookies.filter(({ name }) => name === SESSION_COOKIE);
  if (sessionCookie[0]) {
    await redisService.deleteSession(sessionCookie[0].value);
  }
};

export const clickAndFillLocator = async (locator: Locator, val: string): Promise<void> => {
  await locator.click();
  await locator.fill(val);
};

export const login = async (
  page: Page,
  user: string = defaultUser,
  password: string = defaultPassword,
  waitForRoot = true
): Promise<void> => {
  if (!page.url().includes("login")) {
    await page.goto("/login");
  }
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
  if (waitForRoot && shouldWaitForRoot(user, password)) {
    await page.waitForURL("/");
  }
};

export const typedObjectKeys = <T extends Record<string, unknown>>(arg: T): (keyof T)[] =>
  Object.keys(arg);

