import { expect, test } from "@playwright/test";
import type { AvailableUsers } from "../db/postgres/seed/seed.js";
import { cleanup, login, userHashMap } from "./utils.js";

const user: AvailableUsers = "logician",
  password = [user, "password"].join("-");

const target = userHashMap[user];

test.beforeEach(async ({ page }) => {
  await login(page, user, password);
  await page.getByRole("listitem", { name: "Profile" }).click();
  await page.waitForURL("/profile");
});

test.afterEach(async ({ context }) => {
  await cleanup(context);
});

test("Should display appropriate fields and data", async ({ page, browser, context, locale }) => {
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
});
