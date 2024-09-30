import {
  expect,
  request,
  type APIRequestContext,
  type BrowserContext,
  type Cookie
} from "@playwright/test";
import {
  CSRF_HEADER,
  LOCAL_SESSION_CSRF_KEY,
  LOGOUT_ROUTE,
  SESSION_COOKIE
} from "../src/constants.js";
import { NOTIFICATION_MESSAGES } from "../src/messages.js";
import { test } from "./fixtures";
import { cleanup, login } from "./utils.js";

const extractCredentials = async (
  storageState: ReturnType<BrowserContext["storageState"]>
): Promise<{ cookie: Cookie | undefined; csrf: string | undefined }> => {
  const { cookies, origins } = await storageState;
  return {
    cookie: cookies.filter(({ name }) => name === SESSION_COOKIE)[0],
    csrf: origins[0]?.localStorage?.filter(({ name }) => name === LOCAL_SESSION_CSRF_KEY)[0]?.value
  };
};
const hasCredentials = async (
  storageState: ReturnType<BrowserContext["storageState"]>
): Promise<boolean> => {
  const { cookie, csrf } = await extractCredentials(storageState);
  return !!(cookie && csrf);
};

const createContext = (
  baseURL: string,
  cookie: Cookie | undefined,
  csrf: string | undefined
): Promise<APIRequestContext> => {
  return request.newContext({
    baseURL,
    storageState: {
      cookies: cookie ? [cookie] : [],
      origins: csrf
        ? [
            {
              origin: baseURL,
              localStorage: [{ name: LOCAL_SESSION_CSRF_KEY, value: csrf }]
            }
          ]
        : []
    }
  });
};
test.beforeEach(async ({ seedDB }) => {
  await seedDB();
});
test("Should logout by clicking the logout button", async ({ page, context }) => {
  await login(page);
  expect(await hasCredentials(context.storageState())).toBe(true);
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL("/login");
  expect(await hasCredentials(context.storageState())).toBe(false);
});
test("Should show notification", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(
    page.getByRole("alert").getByText(NOTIFICATION_MESSAGES.logoutSuccess)
  ).toBeVisible();
});
test("Should show failure notification", async ({ page }) => {
  await page.route(LOGOUT_ROUTE, async (route) => {
    await route.fulfill({
      status: 403,
      json: {
        message: "Error: 403"
      }
    });
  });
  await login(page);
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("alert").getByText(NOTIFICATION_MESSAGES[403])).toBeVisible();
});
test(`Should logout via DELETE request if ${CSRF_HEADER} header is supplied`, async ({
  page,
  context,
  baseURL
}) => {
  await login(page);
  const { csrf, cookie } = await extractCredentials(context.storageState());
  const req = await createContext(baseURL as string, cookie, csrf);
  const response = await req.delete(LOGOUT_ROUTE, {
    headers: { [CSRF_HEADER]: csrf as string }
  });
  expect(response.status()).toBe(200);
  await page.goto("/login");
  await expect(page).toHaveURL("/login");
});
test(`Should reject DELETE request if ${CSRF_HEADER} header or session cookie is missing`, async ({
  baseURL,
  page,
  context
}) => {
  await login(page);
  const { cookie, csrf } = await extractCredentials(context.storageState());
  const reqWithoutCookie = await createContext(baseURL as string, undefined, csrf);
  const reqWithoutCsrf = await createContext(baseURL as string, cookie, undefined);
  for (const req of [reqWithoutCookie, reqWithoutCsrf]) {
    const { csrf } = await extractCredentials(req.storageState());
    const response = await req.delete(LOGOUT_ROUTE, {
      headers: csrf ? { [CSRF_HEADER]: csrf } : {}
    });
    expect(response.status()).toBe(403);
  }
  await cleanup(context);
});
