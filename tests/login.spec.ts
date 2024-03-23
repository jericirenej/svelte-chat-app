import { expect, test } from "@playwright/test";
import type { AvailableUsers } from "../db/postgres/seed/seed.js";
import { cleanup, clickAndFillLocator, login } from "./utils.js";
import { APP_NAME, LOGIN_MESSAGES } from "../src/messages.js";

const user: AvailableUsers = "babbage",
  password: `${AvailableUsers}-password` = "babbage-password";
const {
  failure,
  success,
  pageTitle,
  passwordPlaceholder,
  signup,
  subtitle,
  supplyDetailsTitle,
  title,
  usernamePlaceholder
} = LOGIN_MESSAGES;

test("App should redirect to login if not authenticated", async ({ page, browserName }) => {
  const urls = ["/", "/profile", "random/page"];
  for (const url of urls) {
    await page.goto(url);
    await expect(page).toHaveURL("/login");
    await page.screenshot({ path: `./tests/screenshots/login-${browserName}.png` });
  }
});

test("Should have appropriate elements", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveTitle(pageTitle);
  await expect(page.getByRole("heading", { level: 1, name: APP_NAME })).toBeVisible();
  await expect(page.getByText(`${title} ${subtitle}`)).toBeVisible();
  const submitButton = page.getByRole("button", { name: "submit" });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toHaveAttribute("title", supplyDetailsTitle);
  for (const placeholder of [usernamePlaceholder, passwordPlaceholder]) {
    await expect(page.getByPlaceholder(placeholder)).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: APP_NAME })).toBeVisible();
  await expect(page.getByRole("link", { name: signup })).toBeVisible();
});

test("Should not allow submission of invalid form", async ({ page }) => {
  await page.goto("/login");
  const submitButton = page.getByRole("button");
  await expect(submitButton).toBeDisabled();
  await page.getByLabel("Username").fill("username");
  await expect(submitButton).toBeDisabled();
  await page.getByLabel("Username").clear();
  await page.getByLabel("Password").fill("password");
  await expect(submitButton).toBeDisabled();
});

test("Should allow submit on valid form", async ({ page }) => {
  await page.goto("/login");
  await clickAndFillLocator(page.getByPlaceholder(usernamePlaceholder), "username");
  await clickAndFillLocator(page.getByPlaceholder(passwordPlaceholder), "password");
  await expect(page.getByRole("button", { name: "SUBMIT", exact: true })).toBeEnabled();
});

test("Login page should show message on failed / successful login", async ({ page, context }) => {
  await page.goto("/login");
  await login(page, "user", "password", false);
  await expect(page.getByText(failure)).toBeVisible();

  await login(page, user, password, false);
  await expect(page.getByText(success)).toBeVisible();
  await cleanup(context);
});
test("Successful login should redirect to root", async ({ page, context }) => {
  await page.goto("/login");
  await login(page, user, password, false);
  await expect(page).toHaveURL("/");
  await cleanup(context);
});
test("Successful login should persist when new page with same storageState is opened", async ({
  page,
  context
}) => {
  await login(page);
  const newPage = await context.newPage();
  await page.close();
  await newPage.goto("/login");
  await newPage.waitForURL("/");
});
