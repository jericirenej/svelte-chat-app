import { expect, test, type BrowserContext } from "@playwright/test";
import type { AvailableUsers } from "../db/postgres/seed/seed.js";
import { LOCAL_SESSION_CSRF_KEY, SESSION_COOKIE } from "../src/constants.js";
const hasCredentials = async (
  storageState: ReturnType<BrowserContext["storageState"]>
): Promise<boolean> => {
  const { cookies, origins } = await storageState;
  const hasCookie = cookies.some(({ name }) => name === SESSION_COOKIE);
  const hasCSRF = origins[0].localStorage.some(({ name }) => name === LOCAL_SESSION_CSRF_KEY);
  return hasCookie && hasCSRF;
};

test.describe("Logout", () => {
  const user: AvailableUsers = "lovelace",
    password: `${AvailableUsers}-password` = "lovelace-password";
  test("Should logout by clicking the logout button", async ({ page, context }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill(user);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "SUBMIT" }).click();
    await expect(page).toHaveURL("/");

    expect(await hasCredentials(context.storageState())).toBe(true);
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL("/login");
    expect(await hasCredentials(context.storageState())).toBe(false);
  });
});
