import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { ROOT_ROUTE, SIGNUP_ROUTE } from "../src/constants";
import { APP_NAME, LOGIN_MESSAGES, SIGNUP_MESSAGES } from "../src/messages.js";

import { createDbConnectionAndMigrator } from "../db/postgres/tools/testing-db-helper";
import { typedJsonClone } from "../db/postgres/tools/utils";
import { typedObjectKeys } from "./utils";

const {
  title,
  subtitle,
  pageTitle,
  login,
  supplyDetailsTitle,
  namePlaceholder,
  passwordPlaceholder,
  passwordVerifyPlaceholder,
  surnamePlaceholder,
  usernamePlaceholder,
  emailPlaceholder,
  success,
  duplicateFailure
} = SIGNUP_MESSAGES;

const exampleUser = (info: TestInfo, browserName: string) => {
  const username = `signup_${browserName}_${info.parallelIndex}`,
    password = `${username}-password`,
    email = `${username}@nowhere.never`,
    name = "User",
    surname = "Surname";
  return {
    username: { value: username, placeholder: usernamePlaceholder },
    email: { value: email, placeholder: emailPlaceholder },
    password: { value: password, placeholder: passwordPlaceholder },
    passwordVerify: { value: password, placeholder: passwordVerifyPlaceholder },
    name: { value: name, placeholder: namePlaceholder },
    surname: { value: surname, placeholder: surnamePlaceholder }
  };
};

const fillSignupForm = async (
  page: Page,
  arg: Partial<ReturnType<typeof exampleUser>>,
  submit = false
) => {
  for (const key of typedObjectKeys(arg)) {
    const prop = arg[key];
    if (!prop) continue;
    await page.getByPlaceholder(prop.placeholder, { exact: true }).fill(prop.value);
  }
  if (submit) {
    await page.getByRole("button", { name: "submit" }).click();
  }
};

const { db } = createDbConnectionAndMigrator("chat");
test.beforeEach(async ({ page }) => {
  await page.goto(SIGNUP_ROUTE);
});

test.afterAll(async () => {
  await db.destroy();
});
test("Should allow direct navigation", async ({ page, browserName }) => {
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.screenshot({ path: `./tests/screenshots/signup-${browserName}.png` });
});
test("Should have appropriate elements", async ({ page }) => {
  await expect(page).toHaveTitle(pageTitle);

  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText(subtitle)).toBeVisible();

  for (const placeholder of [
    usernamePlaceholder,
    emailPlaceholder,
    passwordPlaceholder,
    passwordVerifyPlaceholder,
    namePlaceholder,
    surnamePlaceholder
  ]) {
    await expect(page.getByPlaceholder(placeholder, { exact: true })).toBeVisible();
  }

  const submitButton = page.getByRole("button", { name: "submit" });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toHaveAttribute("title", supplyDetailsTitle);
  await expect(submitButton).toBeDisabled();

  await expect(page.getByRole("heading", { level: 1, name: APP_NAME })).toBeVisible();

  await expect(page.getByRole("link", { name: login })).toBeVisible();
});

test("Should navigate to login", async ({ page }) => {
  await page.getByRole("link", { name: login }).click();
  await expect(page.getByRole("heading", { name: LOGIN_MESSAGES.title })).toBeVisible();
});

test("Should register new user and redirect", async ({ page, browserName }) => {
  const user = exampleUser(test.info(), browserName);

  await fillSignupForm(page, user);
  const submitButton = page.getByRole("button", { name: "submit" });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  await expect(page.getByText(success)).toBeVisible();
  await page.waitForURL("/");
  await expect(page).toHaveURL("/");
  await db.deleteFrom("user").where("username", "=", user.username.value).execute();
});

test("Should reject registration if a username or email already exists", async ({
  page,
  browserName
}) => {
  const index = test.info().parallelIndex;
  const user = exampleUser(test.info(), browserName);
  const alternateUsername = `signup_x_${browserName}_${index}`,
    alternateEmail = `${alternateUsername}@nowhere.never`;
  await fillSignupForm(page, user, true);

  await page.waitForURL("/");
  await page.getByRole("button", { name: "Logout" }).click();
  await page.waitForURL(ROOT_ROUTE);
  await page.goto(SIGNUP_ROUTE);

  await fillSignupForm(page, user, true);
  await expect(page.getByText(duplicateFailure)).toBeVisible();

  for (const [key, value] of [
    ["username", alternateUsername],
    ["email", alternateEmail]
  ] as [keyof typeof user, string][]) {
    const attemptedUser = typedJsonClone(user);
    attemptedUser[key].value = value;

    await fillSignupForm(page, attemptedUser, true);
    await expect(page.getByText(duplicateFailure)).toBeVisible();
  }

  const anotherUser = typedJsonClone(user);
  anotherUser.username.value = alternateUsername;
  anotherUser.email.value = alternateEmail;
  await fillSignupForm(page, anotherUser, true);
  await expect(page.getByText(success)).toBeVisible();

  await db
    .deleteFrom("user")
    .where("username", "in", [user.username.value, anotherUser.username.value])
    .execute();
});
test("Should reject registration if password verification does not match", async ({
  page,
  browserName
}) => {
  const user = exampleUser(test.info(), browserName);
  user.passwordVerify.value = "invalid";
  await fillSignupForm(page, user, false);
  await expect(page.getByRole("button", { name: "submit" })).toBeDisabled();
  user.passwordVerify.value = user.password.value;
  await fillSignupForm(page, user, false);
  await expect(page.getByRole("button", { name: "submit" })).toBeEnabled();
});
