import { expect, test } from "@playwright/test";

/* test.beforeAll(async () => {
  await seed();
}); */
test("Should redirect to login if not authenticated", async ({ page, browserName }) => {
  const urls = ["/", "/profile", "random/page"];
  for (const url of urls) {
    await page.goto(url);
    await expect(page).toHaveURL("/login");
    await page.screenshot({ path: `./tests/screenshots/login-${browserName}.png` });
  }
});
