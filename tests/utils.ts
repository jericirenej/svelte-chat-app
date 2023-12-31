import type { BrowserContext, Locator, Page } from "@playwright/test";
import { redisService } from "../db/index.js";
import { USERS, type AvailableUsers } from "../db/postgres/seed/seed.js";
import { SESSION_COOKIE } from "../src/constants.js";

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
  const sessionCookie = cookies.filter(({ name }) => name === SESSION_COOKIE)[0];
  await redisService.deleteSession(sessionCookie.value);
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
  const submitButton = page.getByRole("button", { name: "SUBMIT" });
  const userField = page.getByLabel("Username"),
    passwordField = page.getByLabel("Password");
  for (const [field, val] of [
    [userField, user],
    [passwordField, password]
  ] as const) {
    await clickAndFillLocator(field, val);
  }

  await submitButton.click();
  if (waitForRoot && shouldWaitForRoot(user, password)) {
    await page.waitForURL("/");
  }
};
