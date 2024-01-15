import { expect, test, type Locator, type Page } from "@playwright/test";
import type { AvailableUsers } from "../db/postgres/seed/seed.js";
import { login, userHashMap } from "./utils.js";

const getPages = (page: Page): Record<"homepage" | "profile", Locator> => {
  return {
    homepage: page.getByTitle("Homepage", { exact: true }),
    profile: page.getByTitle("Profile", { exact: true })
  };
};

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("Should show navbar with appropriate nav items", async ({ page }) => {
  const navbar = page.getByRole("navigation");
  await expect(navbar).toBeVisible();
  const itemNames = ["Homepage", "Profile", "Logout"];
  for (const name of itemNames) {
    const item = navbar.getByRole(name !== "Logout" ? "link" : "button", { name });
    await expect(item).toBeVisible();
    await expect(item).toHaveAttribute("title", name);
    await expect(item.locator("svg")).toBeVisible();
  }
});

test("Should navigate", async ({ page }) => {
  const { homepage, profile } = getPages(page);
  for (const [link, targetUrl] of [
    [profile, "/profile/"],
    [homepage, "/"]
  ] as const) {
    await link.click();
    await expect(page).toHaveURL(targetUrl);
  }
});
test("Should show visual indicator of current page", async ({ page }) => {
  const getMark = (locator: Locator) => locator.locator("span.absolute");
  const { homepage, profile } = getPages(page);

  await expect(getMark(homepage)).toBeVisible();
  await expect(getMark(profile)).toBeHidden();
  await profile.click();
  await page.waitForURL("/profile/");
  await expect(getMark(homepage)).toBeHidden();
  await expect(getMark(profile)).toBeVisible();
});

test("Should show welcome message", async ({ page }) => {
  await page.getByRole("button", { name: "Logout" }).click();
  await page.waitForURL("/login");
  const username: AvailableUsers = "chu_lonzo";
  const name = userHashMap[username].name;
  await login(page, username, `${username}-password`);
  await expect(page.getByRole("heading", { level: 1, name: "Chat App" })).toBeVisible();
  await expect(page.getByText(`Welcome ${name}!`)).toBeVisible();
});
