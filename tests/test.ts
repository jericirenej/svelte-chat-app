import { expect, test } from "@playwright/test";
import type { AvailableUsers } from "../db/postgres/seed/seed.js";

test.describe("LOGIN", () => {
  const user: AvailableUsers = "babbage",
    password: `${AvailableUsers}-password` = "babbage-password";
  test.beforeEach(({ page }) => page.goto("/login"));
  test("App should redirect to login if not authenticated", async ({ page, browserName }) => {
    const urls = ["/", "/profile", "random/page"];
    for (const url of urls) {
      await page.goto(url);
      await expect(page).toHaveURL("/login");
      await page.screenshot({ path: `./tests/screenshots/login-${browserName}.png` });
    }
  });

  test("Should have appropriate elements", async ({ page }) => {
    await expect(page).toHaveTitle("Chat App - Login");
    await expect(page.getByRole("heading", { level: 1, name: "Chat App" })).toBeVisible();
    await expect(page.getByText("Sign in ...and start chatting!")).toBeVisible();
    await expect(page.getByRole("button", { name: "submit" })).toBeVisible();
    for (const placeholder of ["Enter your username", "Enter your password"]) {
      await expect(page.getByPlaceholder(placeholder)).toBeVisible();
    }
  });

  test("Should not allow submission of invalid form", async ({ page }) => {
    const submitButton = page.getByRole("button");
    await expect(submitButton).toBeDisabled();
    await page.getByLabel("Username").fill("username");
    await expect(submitButton).toBeDisabled();
    await page.getByLabel("Username").clear();
    await page.getByLabel("Password").fill("password");
    await expect(submitButton).toBeDisabled();
  });

  test("Should allow submit on valid form", async ({ page }) => {
    const submitButton = page.getByRole("button");
    await page.getByLabel("Username").fill("username");
    await page.getByLabel("Password").fill("password");
    await expect(submitButton).toBeEnabled();
  });

  test("Login page should show message on failed / successful login", async ({ page }) => {
    const submitButton = page.getByRole("button");
    await page.getByLabel("Username").fill("username");
    await page.getByLabel("Password").fill("password");
    await submitButton.click();
    await expect(page.getByText("Username or password not correct!")).toBeVisible();

    await page.getByLabel("Username").fill(user);
    await page.getByLabel("Password").fill(password);
    await submitButton.click();
    await expect(page.getByText("Login successful!")).toBeVisible();
  });
  test("Successful login should redirect to root", async ({ page }) => {
    const submitButton = page.getByRole("button");
    await page.getByLabel("Username").fill(user);
    await page.getByLabel("Password").fill(password);
    await submitButton.click();
    await expect(page).toHaveURL("/");
  });
});
