import { expect } from "@playwright/test";
import { LOGIN_ROUTE, SIGNUP_ROUTE } from "../src/constants";
import { SIGNUP_MESSAGES } from "../src/messages";
import { test } from "./fixtures";

test("Rejects registration if a username or email already exists", async ({
  page,
  clearDB,
  browserName,
  exampleUser,
  fillSignupForm
}) => {
  await clearDB();
  await page.goto(SIGNUP_ROUTE);
  const index = test.info().parallelIndex;
  const alternateUsername = `signup_x_${browserName}_${index + 1}`,
    alternateEmail = `${alternateUsername}@nowhere.never`;
  const anotherUser = structuredClone(exampleUser);
  anotherUser.username.value = alternateUsername;
  anotherUser.email.value = alternateEmail;
  await fillSignupForm(exampleUser, true);

  await page.getByRole("button", { name: "Logout" }).click();
  await page.waitForURL(LOGIN_ROUTE);
  await page.goto(SIGNUP_ROUTE);
  await page.waitForURL(SIGNUP_ROUTE);

  await fillSignupForm(exampleUser, true);
  await expect(page.getByText(SIGNUP_MESSAGES.duplicateFailure)).toBeVisible();

  for (const [key, value] of [
    ["username", alternateUsername],
    ["email", alternateEmail]
  ] as const) {
    const attemptedUser = structuredClone(exampleUser);
    attemptedUser[key].value = value;

    await fillSignupForm(attemptedUser, true);
    await expect(page.getByText(SIGNUP_MESSAGES.duplicateFailure)).toBeVisible();
  }

  await fillSignupForm(anotherUser, true);
  await expect(page.getByText(SIGNUP_MESSAGES.success)).toBeVisible();
  await clearDB();
});
