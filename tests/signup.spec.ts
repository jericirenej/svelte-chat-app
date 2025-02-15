import { expect } from "@playwright/test";
import { ROOT_ROUTE, SIGNUP_ROUTE } from "../src/constants";
import { APP_NAME, LOGIN_MESSAGES, SIGNUP_MESSAGES } from "../src/messages.js";
import { test, type UserData } from "./fixtures";

import { AddAvatarE2E } from "../src/components/organisms/AddAvatar/AddAvatar.e2e";
import { PASSWORD_MIN, USERNAME_MIN } from "../src/constants";

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
  success
} = SIGNUP_MESSAGES;

test.beforeEach(async ({ page, clearDB }) => {
  await clearDB();
  await page.goto(SIGNUP_ROUTE);
});
test.afterEach(async ({ clearDB }) => {
  await clearDB();
});

test("Allows direct navigation", async ({ page, browserName }) => {
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
});
test("Has appropriate elements", async ({ page }) => {
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
  await expect(new AddAvatarE2E(page).uploadButton).toBeVisible();

  const submitButton = page.getByRole("button", { name: "submit" });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toHaveAttribute("title", supplyDetailsTitle);
  await expect(submitButton).toBeDisabled();

  await expect(page.getByRole("heading", { level: 1, name: APP_NAME })).toBeVisible();

  await expect(page.getByRole("link", { name: login })).toBeVisible();
});

test("Navigates to login", async ({ page }) => {
  await page.getByRole("link", { name: login }).click();
  await expect(page.getByRole("heading", { name: LOGIN_MESSAGES.title })).toBeVisible();
});

test("Registers new user and redirects", async ({ page, exampleUser, fillSignupForm }) => {
  await fillSignupForm(exampleUser, false);
  const submitButton = page.getByRole("button", { name: "submit" });
  await submitButton.focus();
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  await expect(page.getByText(success)).toBeVisible();
  await page.waitForURL("/");
  await expect(page).toHaveURL("/");
});

test("Rejects registration if password verification does not match", async ({
  page,
  exampleUser,
  fillSignupForm
}) => {
  exampleUser.passwordVerify.value = "invalid";
  await fillSignupForm(exampleUser, false);
  await expect(page.getByRole("button", { name: "submit" })).toBeDisabled();
  exampleUser.passwordVerify.value = exampleUser.password.value;
  await fillSignupForm(exampleUser, false);
  await expect(page.getByRole("button", { name: "submit" })).toBeEnabled();
});
test("Allows registration with blank optional fields", async ({
  page,
  exampleUser: user,
  fillSignupForm
}) => {
  const exampleUser = user as unknown as Partial<UserData>;
  delete exampleUser.surname;
  delete exampleUser.name;

  await fillSignupForm(exampleUser, false);
  const button = page.getByRole("button", { name: "submit" });
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page).toHaveURL(ROOT_ROUTE);
});
test("Disallows submit if fields are too long", async ({ page, exampleUser, fillSignupForm }) => {
  const overLimit = new Array(101).fill("a").join("");
  await fillSignupForm(exampleUser, false);
  const button = page.getByRole("button", { name: "submit" });
  await expect(button).toBeEnabled();

  for (const target of ["username", "password", "name", "surname"] as const) {
    const locator = page.getByPlaceholder(exampleUser[target].placeholder, { exact: true });
    await locator.fill(overLimit);
    if (target === "password") {
      await page.getByPlaceholder(exampleUser.passwordVerify.placeholder).fill(overLimit);
    }
    await expect(button).toBeDisabled();
    await locator.fill(exampleUser[target].value);
    if (target === "password") {
      await page
        .getByPlaceholder(exampleUser.passwordVerify.placeholder)
        .fill(exampleUser.passwordVerify.value);
    }
    await expect(button).toBeEnabled();
  }
});
test("Disallows submit if username is too short", async ({ page, exampleUser, fillSignupForm }) => {
  const value = new Array(USERNAME_MIN - 1).fill("a").join("");
  await fillSignupForm(exampleUser, false);
  const button = page.getByRole("button", { name: "submit" });
  await page.getByPlaceholder(exampleUser.username.placeholder).fill(value);
  await expect(button).toBeDisabled();
  await page.getByPlaceholder(exampleUser.username.placeholder, { exact: true }).fill(value + "a");

  await expect(button).toBeEnabled();
});
test("Disallows submit if password is too short", async ({ page, exampleUser, fillSignupForm }) => {
  const value = new Array(PASSWORD_MIN - 1).fill("a").join("");
  await fillSignupForm(exampleUser, false);
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
