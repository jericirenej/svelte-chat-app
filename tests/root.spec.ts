import { expect, type Locator, type Page } from "@playwright/test";
import type { AvailableUsers } from "@utils/users.js";
import { PROFILE_ROUTE, ROOT_ROUTE } from "../src/constants.js";
import { test } from "./fixtures";
import { userHashMap } from "./utils.js";

const getPages = (page: Page): Record<"homepage" | "profile", Locator> => {
  return {
    homepage: page.getByTitle("Homepage", { exact: true }),
    profile: page.getByTitle("Profile", { exact: true })
  };
};

test.beforeEach(async ({ seedDB, login }) => {
  await seedDB();
  await login("lovelace");
});

test("Shows navbar with appropriate nav items", async ({ page }) => {
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
    [profile, PROFILE_ROUTE],
    [homepage, ROOT_ROUTE]
  ] as const) {
    await link.click();
    await expect(page).toHaveURL(new RegExp(targetUrl));
  }
});
test("Shows visual indicator of current page", async ({ page }) => {
  const getMark = (locator: Locator) => locator.locator("span.absolute");
  const { homepage, profile } = getPages(page);

  await expect(getMark(homepage)).toBeVisible();
  await expect(getMark(profile)).toBeHidden();
  await profile.click();
  await page.waitForURL(new RegExp(PROFILE_ROUTE));
  await expect(getMark(homepage)).toBeHidden();
  await expect(getMark(profile)).toBeVisible();
});

test("Shows welcome message", async ({ page, login }) => {
  await page.getByRole("button", { name: "Logout" }).click();
  await page.waitForURL("/login");
  const username: AvailableUsers = "chu_lonzo";
  const name = userHashMap[username].name;
  await login(username);
  await expect(page.getByRole("heading", { level: 1, name: "Chat App" })).toBeVisible();
  await expect(page.getByText(`Welcome ${name}!`)).toBeVisible();
});
