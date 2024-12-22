import { expect, type Page } from "@playwright/test";
import type { AvailableUsers } from "@utils/users.js";
import type { CreateUserDto } from "../db/postgres/types.js";
import { CSRF_HEADER, DELETE_ACCOUNT_ROUTE, LOGIN_ROUTE, PROFILE_ROUTE } from "../src/constants.js";
import { NOTIFICATION_MESSAGES, PROFILE_MESSAGES } from "../src/messages.js";
import { genPassword } from "../utils/generate-password.js";

import { test as fixtures, type CustomFixtures } from "./fixtures";
import { userHashMap } from "./utils.js";

const user: AvailableUsers = "logician";
type LoginAndNavigateArgs = Parameters<CustomFixtures["login"]>;
const target = userHashMap[user];
const test = fixtures.extend<{
  loginAndNavigate: (...args: LoginAndNavigateArgs) => Promise<void>;
}>({
  loginAndNavigate: async ({ page, login }, use) => {
    await use(async (...args: LoginAndNavigateArgs) => {
      await login(...args);
      await page.goto(PROFILE_ROUTE);
    });
  }
});

const deleteButton = (page: Page) =>
  page.getByRole("button", { name: PROFILE_MESSAGES.deleteButton });

test.beforeEach(async ({ seedDB }) => {
  await seedDB();
});

test("Should display appropriate fields and data", async ({ page, locale, loginAndNavigate }) => {
  await loginAndNavigate(user);
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await expect(page.getByText(user, { exact: true })).toBeVisible();
  const dateFormat = new Intl.DateTimeFormat(locale);
  const data = [
    ["Id", target.id],
    ["Email", target.email],
    ["Name", target.name],
    ["Surname", target.surname],
    ["CreatedAt", dateFormat.format(target.createdAt)],
    ["UpdatedAt", dateFormat.format(target.createdAt)],
    ["Role", target.role ?? "user"]
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
  const createUsername = (browserName: string, i: number) => `del_${browserName}_${i + 1}`;
  const password = `delete-user-password`;
  const { hash, salt } = genPassword(password);

  test.beforeEach(async ({ browserName, dbService }) => {
    const newUser: CreateUserDto = {
      email: `${createUsername(browserName, test.info().parallelIndex)}@nowhere.never`,
      username: createUsername(browserName, test.info().parallelIndex),
      hash,
      salt
    };
    await dbService.addUser(newUser);
  });
  test.afterEach(async ({ browserName, dbService }) => {
    const username = createUsername(browserName, test.info().parallelIndex);
    const user = await dbService.getUser({ property: "username", value: username });
    if (user) {
      await dbService.removeUser(user.id, user.id);
    }
  });
  test("Clicking on delete account should show dialog", async ({
    page,
    browserName,
    loginAndNavigate
  }) => {
    await loginAndNavigate(createUsername(browserName, test.info().parallelIndex), { password });
    await expect(deleteButton(page)).toBeVisible();
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
    browserName,
    loginAndNavigate
  }) => {
    await loginAndNavigate(createUsername(browserName, test.info().parallelIndex), { password });
    const dialog = page.getByRole("dialog");
    for (const key of ["Escape", "Enter"]) {
      await expect(deleteButton(page)).toBeVisible();
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
    browserName,
    dbService,
    loginAndNavigate
  }) => {
    await loginAndNavigate(createUsername(browserName, test.info().parallelIndex), {
      password
    });
    await expect(deleteButton(page)).toBeVisible();
    await deleteButton(page).click();
    const confirm = page.getByRole("button", { name: PROFILE_MESSAGES.deleteConfirm });
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(confirm).toBeVisible();
    await confirm.click();
    await expect(page).toHaveURL(LOGIN_ROUTE);
    const userExists = await dbService.usernameExists(
      createUsername(browserName, test.info().parallelIndex)
    );
    expect(userExists).toBeFalsy();
  });
  test("Successful delete should show notification", async ({
    page,
    browserName,
    loginAndNavigate
  }) => {
    await loginAndNavigate(createUsername(browserName, test.info().parallelIndex), { password });
    await deleteButton(page).click();
    await page.getByRole("button", { name: PROFILE_MESSAGES.deleteConfirm }).click();
    await expect(
      page.getByRole("alert").getByText(NOTIFICATION_MESSAGES.deleteAccountSuccess)
    ).toBeVisible();
  });
  test("Delete operation should fail, if csrf header is not present", async ({
    page,
    browserName,
    dbService,
    loginAndNavigate
  }) => {
    const resp = page.waitForResponse((resp) => resp.url().includes(DELETE_ACCOUNT_ROUTE));
    await loginAndNavigate(createUsername(browserName, test.info().parallelIndex), {
      password
    });
    await page.route(DELETE_ACCOUNT_ROUTE, async (route) => {
      const headers = route.request().headers();
      delete headers[CSRF_HEADER.toLowerCase()];
      await route.continue({ headers });
    });
    await deleteButton(page).click({ delay: 30 });
    await page.getByRole("button", { name: PROFILE_MESSAGES.deleteConfirm }).click();

    await expect(page).toHaveURL(new RegExp(PROFILE_ROUTE));

    const userExists = await dbService.usernameExists(
      createUsername(browserName, test.info().parallelIndex)
    );
    expect(userExists).toBeTruthy();
    const awaitedResponse = await resp;
    expect(awaitedResponse.status()).toBe(403);
  });
  test("Unauthorized delete operation should show appropriate notification", async ({
    page,
    browserName,
    loginAndNavigate
  }) => {
    await loginAndNavigate(createUsername(browserName, test.info().parallelIndex), { password });
    await page.route(DELETE_ACCOUNT_ROUTE, async (route) => {
      const headers = route.request().headers();
      delete headers[CSRF_HEADER.toLowerCase()];
      await route.continue({ headers });
    });

    await deleteButton(page).click({ delay: 50 });
    await page.getByRole("button", { name: PROFILE_MESSAGES.deleteConfirm }).click();
    await expect(page.getByRole("alert").getByText(NOTIFICATION_MESSAGES[403])).toBeVisible();
  });
  test("Should not allow super-admins to delete own account", async ({
    page,
    dbService,
    loginAndNavigate
  }) => {
    const resp = page.waitForResponse((resp) => resp.url().includes(DELETE_ACCOUNT_ROUTE));
    await loginAndNavigate(userHashMap.lovelace.username, {
      password: `${userHashMap.lovelace.username}-password`
    });
    await deleteButton(page).click();
    await page.getByRole("button", { name: PROFILE_MESSAGES.deleteConfirm }).click();
    await page.reload();
    await expect(page).toHaveURL(new RegExp(PROFILE_ROUTE));
    const userExists = await dbService.usernameExists(userHashMap.lovelace.username);
    expect(userExists).toBeTruthy();
    const awaitedResponse = await resp;
    expect(awaitedResponse.status()).toBe(400);
  });
  test("Should show notification for super-user delete attempt", async ({
    page,
    loginAndNavigate
  }) => {
    await loginAndNavigate(userHashMap.lovelace.username, {
      password: `${userHashMap.lovelace.username}-password`
    });
    await deleteButton(page).click();
    await page.getByRole("button", { name: PROFILE_MESSAGES.deleteConfirm }).click();
    await expect(
      page
        .getByRole("alert")
        .getByText(
          "Super administrators cannot delete their own account without privilege transfer!"
        )
    ).toBeVisible();
  });
});
