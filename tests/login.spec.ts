import { expect } from "@playwright/test";
import type { AvailableUsers } from "@utils/users.js";
import { LOGIN_ROUTE, ROOT_ROUTE } from "../src/constants.js";
import { APP_NAME, LOGIN_MESSAGES, SIGNUP_MESSAGES } from "../src/messages.js";
import { test } from "./fixtures";
import { clickAndFillLocator, login } from "./utils.js";
import type { UserNames } from "@db/postgres/seed/default-seed.js";

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

test.beforeEach(async ({ seedDB }) => {
  await seedDB<UserNames>({
    chats: [
      {
        participants: ["babbage", "incomplete_guy"],
        messages: [],
        name: "Some custom talk"
      }
    ]
  });
});
test("App redirects to login if not authenticated", async ({ page, browserName, baseURL }) => {
  const urls = ["/", "/profile", "random/page"];
  for (const url of urls) {
    await page.waitForLoadState("domcontentloaded");
    await page.goto(url);
    await expect(page).toHaveURL(LOGIN_ROUTE);
    await expect(page).toHaveScreenshot(`login-${browserName}.png`, {
      fullPage: true
    });
  }
});

test("Has appropriate elements", async ({ page }) => {
  await page.goto(LOGIN_ROUTE);
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
test("Navigates to signup", async ({ page }) => {
  await page.goto(LOGIN_ROUTE);
  await page.getByRole("link", { name: signup }).click();
  await expect(page.getByRole("heading", { name: SIGNUP_MESSAGES.title })).toBeVisible();
});

test("Disallows invalid form submission", async ({ page }) => {
  await page.goto(LOGIN_ROUTE);
  const submitButton = page.getByRole("button");
  await expect(submitButton).toBeDisabled();
  await page.getByLabel("Username").fill("username");
  await expect(submitButton).toBeDisabled();
  await page.getByLabel("Username").clear();
  await page.getByLabel("Password").fill("password");
  await expect(submitButton).toBeDisabled();
});

test("Allows valid form submission", async ({ page }) => {
  await page.goto(LOGIN_ROUTE);
  await clickAndFillLocator(page.getByPlaceholder(usernamePlaceholder), "username");
  await clickAndFillLocator(page.getByPlaceholder(passwordPlaceholder), "password");
  await expect(page.getByRole("button", { name: "SUBMIT", exact: true })).toBeEnabled();
});

test("Shows message on failed  login", async ({ page }) => {
  await page.goto(LOGIN_ROUTE);
  await login(page, "user", "password", false);
  await expect(page.getByText(failure)).toBeVisible();
});
test("Shows notification on successful login", async ({ page }) => {
  await login(page, user, password, false);
  await expect(page.getByRole("alert").getByText(success)).toBeVisible();
});
test("Successful login should redirect to root", async ({ page }) => {
  await page.goto(LOGIN_ROUTE);
  await login(page, user, password, false);
  await expect(page).toHaveURL("/");
});
test("Successful login persists when new page with same storageState is opened", async ({
  page,
  context
}) => {
  await login(page);
  const newPage = await context.newPage();
  await page.close();
  await newPage.goto(LOGIN_ROUTE);
  await expect(newPage).toHaveURL(ROOT_ROUTE);
});
