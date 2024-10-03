import { expect, type Page, type TestInfo } from "@playwright/test";
import { LOGIN_ROUTE, ROOT_ROUTE, SIGNUP_ROUTE } from "../src/constants";
import { APP_NAME, LOGIN_MESSAGES, SIGNUP_MESSAGES } from "../src/messages.js";
import { test } from "./fixtures";

import { typedJsonClone } from "../db/postgres/tools/utils";
import { PASSWORD_MIN, USERNAME_MIN } from "../src/lib/client/login-signup-validators";
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
  // eslint-disable-next-line playwright/no-networkidle
  await page.waitForLoadState("networkidle");
  for (const key of typedObjectKeys(arg)) {
    const prop = arg[key];
    if (!prop) continue;
    const input = page.getByPlaceholder(prop.placeholder, { exact: true });
    await input.fill(prop.value);
    await input.press("Tab");
  }
  if (submit) {
    const btn = page.getByRole("button", { name: "submit" });
    await btn.focus();
    await btn.click();
    await page.waitForLoadState("domcontentloaded");
  }
};
test.beforeEach(async ({ page, clearDB }) => {
  await clearDB();
  await page.goto(SIGNUP_ROUTE);
});

test.afterAll(async ({ seedAll }) => {
  await seedAll();
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

  await fillSignupForm(page, user, false);
  const submitButton = page.getByRole("button", { name: "submit" });
  await submitButton.focus();
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  await expect(page.getByText(success)).toBeVisible();
  await page.waitForURL("/");
  await expect(page).toHaveURL("/");
});

test("Should reject registration if a username or email already exists", async ({
  page,
  browserName
}) => {
  const index = test.info().parallelIndex;
  const user = exampleUser(test.info(), browserName);
  const alternateUsername = `signup_x_${browserName}_${index + 1}`,
    alternateEmail = `${alternateUsername}@nowhere.never`;
  const anotherUser = typedJsonClone(user);
  anotherUser.username.value = alternateUsername;
  anotherUser.email.value = alternateEmail;
  await fillSignupForm(page, user, true);

  await page.getByRole("button", { name: "Logout" }).click();
  await page.waitForURL(LOGIN_ROUTE);
  await page.goto(SIGNUP_ROUTE);
  await page.waitForURL(SIGNUP_ROUTE);

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

  await fillSignupForm(page, anotherUser, true);
  await expect(page.getByText(success)).toBeVisible();
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
test("Should allow registration with blank optional fields", async ({ page, browserName }) => {
  const user = exampleUser(test.info(), browserName) as unknown as Partial<
    ReturnType<typeof exampleUser>
  >;

  delete user.surname;
  delete user.name;

  await fillSignupForm(page, user, false);
  const button = page.getByRole("button", { name: "submit" });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page).toHaveURL(ROOT_ROUTE);
  const username = user.username?.value;
});
test("Should disallow submit if fields are too long", async ({ page, browserName }) => {
  const user = exampleUser(test.info(), browserName);
  const overLimit = new Array(101).fill("a").join("");
  await fillSignupForm(page, user, false);
  const button = page.getByRole("button", { name: "submit" });
  await expect(button).toBeEnabled();

  for (const target of ["username", "password", "name", "surname"] as const) {
    const locator = page.getByPlaceholder(user[target].placeholder, { exact: true });
    await locator.fill(overLimit);
    if (target === "password") {
      await page.getByPlaceholder(user.passwordVerify.placeholder).fill(overLimit);
    }
    await expect(button).toBeDisabled();
    await locator.fill(user[target].value);
    if (target === "password") {
      await page.getByPlaceholder(user.passwordVerify.placeholder).fill(user.passwordVerify.value);
    }
    await expect(button).toBeEnabled();
  }
});
test("Should disallow submit if username is too short", async ({ page, browserName }) => {
  const user = exampleUser(test.info(), browserName);
  const value = new Array(USERNAME_MIN - 1).fill("a").join("");

  await fillSignupForm(page, user, false);
  const button = page.getByRole("button", { name: "submit" });
  await page.getByPlaceholder(user.username.placeholder).fill(value);
  await expect(button).toBeDisabled();
  await page.getByPlaceholder(user.username.placeholder, { exact: true }).fill(value + "a");

  await expect(button).toBeEnabled();
});
test("Should disallow submit if password is too short", async ({ page, browserName }) => {
  const user = exampleUser(test.info(), browserName);
  const value = new Array(PASSWORD_MIN - 1).fill("a").join("");
  await fillSignupForm(page, user, false);
  const fillPassword = async (val: string) => {
    for (const placeholder of [passwordPlaceholder, passwordVerifyPlaceholder]) {
      await page.getByPlaceholder(placeholder, { exact: true }).fill(val);
    }
  };
  const button = page.getByRole("button", { name: "submit" });
  await fillPassword(value);
  await expect(button).toBeDisabled();
  await fillPassword(value + "a");
  await expect(button).toBeEnabled();
});
