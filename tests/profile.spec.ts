import { expect, test, type Page } from "@playwright/test";
import { dbService } from "../db/postgres/db-service.js";
import type { AvailableUsers } from "../db/postgres/seed/seed.js";
import type { CreateUserDto } from "../db/postgres/types.js";
import {
  CSRF_HEADER,
  DELETE_ACCOUNT_ROUTE,
  LOGIN_ROUTE,
  PROFILE_ROUTE,
  ROOT_ROUTE
} from "../src/constants.js";
import { PROFILE_MESSAGES } from "../src/messages.js";
import { genPassword } from "../utils/generate-password.js";
import { login, userHashMap } from "./utils.js";

const user: AvailableUsers = "logician",
  password = [user, "password"].join("-");

const target = userHashMap[user];

const deleteButton = (page: Page) =>
  page.getByRole("button", { name: PROFILE_MESSAGES.deleteButton });

const loginUserAndNavigate = async (page: Page, user: string, password: string): Promise<void> => {
  await login(page, user, password);
  await page.waitForURL(ROOT_ROUTE);
  await page.goto(PROFILE_ROUTE);
};

test("Should display appropriate fields and data", async ({ page, browser, context, locale }) => {
  await loginUserAndNavigate(page, user, password);
  await expect(page.getByRole("heading")).toContainText("Profile");
  await expect(page.getByRole("paragraph")).toContainText(user);
  const dateFormat = new Intl.DateTimeFormat(locale);
  const data = [
    ["Id", target.id],
    ["Email", target.email],
    ["Name", target.name],
    ["Surname", target.surname],
    ["CreatedAt", dateFormat.format(target.createdAt)],
    ["UpdatedAt", dateFormat.format(target.createdAt)],
    ["Role", target.admin ?? "user"]
  ];

  for (const [label, value] of data) {
    const tag = `${label}:`;
    const labelEl = page.locator("dt").getByText(tag, { exact: true });
    const valueEl = await labelEl.evaluate((el) => el.nextElementSibling?.textContent);
    await expect(labelEl).toBeVisible();
    expect(valueEl).toBe(value);
  }
  await expect(deleteButton(page)).toBeVisible();
  await expect(deleteButton(page)).toBeEnabled();
});

test.describe("Delete account", () => {
  const createUsername = (browserName: string) => `del_${browserName}`;
  const password = `delete-user-password`;
  const { hash, salt } = genPassword(password);
  test.beforeEach(async ({ browserName }) => {
    const newUser: CreateUserDto = {
      email: `${createUsername(browserName)}@nowhere.never`,
      username: createUsername(browserName),
      hash,
      salt
    };
    await dbService.addUser(newUser);
  });
  test.afterEach(async ({ browserName }) => {
    const username = `del_${browserName}`;
    const user = await dbService.getUser({ property: "username", value: username });
    if (user) {
      await dbService.removeUser(user.id, user.id);
    }
  });
  test("Clicking on delete account should show dialog", async ({ page, browserName }) => {
    await loginUserAndNavigate(page, createUsername(browserName), password);
    await deleteButton(page).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: PROFILE_MESSAGES.deleteDialogHeading })
    ).toBeVisible();
    await expect(dialog.getByText(PROFILE_MESSAGES.deleteMessage)).toBeVisible();
    await expect(dialog.getByRole("button", { name: "No" })).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: PROFILE_MESSAGES.deleteConfirm })
    ).toBeVisible();
  });
  test("Escape press, direct enter press, or clicking the 'No' button should not delete account", async ({
    page,
    browserName
  }) => {
    await loginUserAndNavigate(page, createUsername(browserName), password);
    const dialog = page.getByRole("dialog");
    for (const key of ["Escape", "Enter"]) {
      await deleteButton(page).click();
      await expect(dialog).toBeVisible();
      await page.keyboard.press(key);
      await expect(dialog).toBeHidden();
    }

    await deleteButton(page).click();
    await dialog.getByRole("button", { name: "No" }).click();
    await expect(dialog).toBeHidden();
    await expect(deleteButton(page)).toBeEnabled();
  });
  test("Confirmation should delete account and redirect to login", async ({
    page,
    browserName
  }) => {
    await loginUserAndNavigate(page, createUsername(browserName), password);
    await deleteButton(page).click();
    await page.getByRole("button", { name: PROFILE_MESSAGES.deleteConfirm }).click();
    await expect(page).toHaveURL(LOGIN_ROUTE);
    const userExists = await dbService.usernameExists(createUsername(browserName));
    expect(userExists).toBeFalsy();
  });
  test("Delete operation should fail, if csrf header is not present", async ({
    page,
    browserName
  }) => {
    const resp = page.waitForResponse((resp) => resp.url().includes(DELETE_ACCOUNT_ROUTE));
    await page.route(DELETE_ACCOUNT_ROUTE, async (route) => {
      console.log(route.request().url());
      const headers = route.request().headers();
      delete headers[CSRF_HEADER.toLowerCase()];
      await route.continue({ headers });
    });
    await loginUserAndNavigate(page, createUsername(browserName), password);
    await deleteButton(page).click();
    await page.getByRole("button", { name: PROFILE_MESSAGES.deleteConfirm }).click();

    await expect(page).toHaveURL(new RegExp(PROFILE_ROUTE));
    const userExists = await dbService.usernameExists(createUsername(browserName));
    expect(userExists).toBeTruthy();
    const awaitedResponse = await resp;
    expect(awaitedResponse.status()).toBe(403);
  });
  test("Should not allow super-admins to delete own account", async ({ page }) => {
    const resp = page.waitForResponse((resp) => resp.url().includes(DELETE_ACCOUNT_ROUTE));
    await loginUserAndNavigate(
      page,
      userHashMap.lovelace.username,
      `${userHashMap.lovelace.username}-password`
    );
    await deleteButton(page).click();
    await page.getByRole("button", { name: PROFILE_MESSAGES.deleteConfirm }).click();
    await page.reload();
    await expect(page).toHaveURL(new RegExp(PROFILE_ROUTE));
    const userExists = await dbService.usernameExists(userHashMap.lovelace.username);
    expect(userExists).toBeTruthy();
    const awaitedResponse = await resp;
    expect(awaitedResponse.status()).toBe(400);
  });
});
