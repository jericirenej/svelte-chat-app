import { TestingDatabases } from "@db/postgres/tools/testing.database.service.js";
import { redisService } from "@db/redis";
import { type BrowserContext, type Locator, type Page, type TestInfo } from "@playwright/test";
import { USERS_WITH_ID, type AvailableUsers } from "@utils/users.js";
import { resolve } from "path";
import { SESSION_COOKIE } from "../src/constants.js";

export const userHashMap = USERS_WITH_ID.reduce(
  (acc, curr) => {
    acc[curr.username] = curr;
    return acc;
  },
  {} as Record<AvailableUsers, (typeof USERS_WITH_ID)[number]>
);

export const cleanup = async (context: BrowserContext): Promise<void> => {
  const cookies = await context.cookies();
  const sessionCookie = cookies.filter(({ name }) => name === SESSION_COOKIE);
  if (sessionCookie[0]) {
    await redisService.deleteSession(sessionCookie[0].value);
  }
};

export const clickAndFillLocator = async (locator: Locator, val: string): Promise<void> => {
  await locator.click({ delay: 50 });
  await locator.fill(val);
  await locator.press("Tab");
};
export const IMAGE_PATHS = {
  landscape: resolve(
    import.meta.dirname,
    "../utils/images/Ruisdael_1653_Two_watermills_an_an_open_sluice.webp"
  ),
  portrait: resolve(
    import.meta.dirname,
    "../utils/images/Caillebote_1876_Young_man_ at_his_window.webp"
  )
};
export type ImageTypes = keyof typeof IMAGE_PATHS;
export const uploadFile = async ({
  path,
  action,
  page
}: {
  path: ImageTypes;
  action: () => Promise<unknown>;
  page: Page;
}) => {
  const filePromise = page.waitForEvent("filechooser");
  await action();
  const fileChooser = await filePromise;
  await fileChooser.setFiles(IMAGE_PATHS[path]);
};

export const typedObjectKeys = <T extends Record<string, unknown>>(arg: T): (keyof T)[] =>
  Object.keys(arg);

export const e2eDatabases = new TestingDatabases();
export const dbName = (info: TestInfo | number) =>
  `chat_test_${typeof info === "number" ? info : info.parallelIndex + 1}`;

export const sleep = async (ms: number) => await new Promise((resolve) => setTimeout(resolve, ms));
