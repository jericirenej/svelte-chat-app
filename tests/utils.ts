import type { BrowserContext, Page } from "@playwright/test";
import { redisService } from "../db/index.js";
import { USERS, type AvailableUsers } from "../db/postgres/seed/seed.js";
import { SESSION_COOKIE } from "../src/constants.js";

const defaultUser: AvailableUsers = "lovelace",
  defaultPassword: `${AvailableUsers}-password` = "lovelace-password";

const shouldWaitForRoot = (user: string, password: string): boolean => {
  if (!USERS.some(({ username }) => username === user)) return false;
  return password === `${user}-password`;
};

export const cleanup = async (context: BrowserContext): Promise<void> => {
  const cookies = await context.cookies();
  const sessionCookie = cookies.filter(({ name }) => name === SESSION_COOKIE)[0];
  await redisService.deleteSession(sessionCookie.value);
};

export const login = async (
  page: Page,
  user: string = defaultUser,
  password: string = defaultPassword,
  waitForRoot = true
): Promise<void> => {
  if (!page.url().includes("login")) await page.goto("login");
  await page.getByLabel("Username").fill(user);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "SUBMIT" }).click();
  if (waitForRoot && shouldWaitForRoot(user, password)) {
    await page.waitForURL("/");
  }
};
