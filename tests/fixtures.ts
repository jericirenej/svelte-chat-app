/* eslint-disable no-empty-pattern */
import type { DatabaseService } from "@db/postgres/db-service";
import type { SeedSchema } from "@db/postgres/tools/testing.database.service";
import { test as base, expect, type Page, type TestInfo } from "@playwright/test";
import { BASE_PORT, WORKERS } from "../playwright.config";
import { LOGIN_ROUTE, ROOT_ROUTE } from "../src/constants";
import { LOGIN_MESSAGES, SIGNUP_MESSAGES } from "../src/messages";
import { dbName, e2eDatabases, sleep, typedObjectKeys, uploadFile, type ImageTypes } from "./utils";
import type { BlobStorageService } from "@db/index";
import type { Maybe } from "../src/types";
import { AddAvatarE2E } from "../src/components/organisms/AddAvatar/AddAvatar.e2e";

const exampleUser = (info: TestInfo, browserName: string) => {
  const username = `signup_${browserName}_${info.parallelIndex}`,
    password = `${username}-password`,
    email = `${username}@nowhere.never`,
    name = "User",
    surname = "Surname";
  return {
    username: { value: username, placeholder: SIGNUP_MESSAGES.usernamePlaceholder },
    email: { value: email, placeholder: SIGNUP_MESSAGES.emailPlaceholder },
    password: { value: password, placeholder: SIGNUP_MESSAGES.passwordPlaceholder },
    passwordVerify: { value: password, placeholder: SIGNUP_MESSAGES.passwordVerifyPlaceholder },
    name: { value: name, placeholder: SIGNUP_MESSAGES.namePlaceholder },
    surname: { value: surname, placeholder: SIGNUP_MESSAGES.surnamePlaceholder },
    avatar: { path: "portrait" as Maybe<ImageTypes> }
  };
};

export type UserData = ReturnType<typeof exampleUser>;

export type CustomFixtures = {
  dbService: DatabaseService;
  clearDB: () => Promise<void>;
  seedDB: <T extends string>(schema?: SeedSchema<T>) => Promise<void>;
  seedAll: <T extends string>(schema?: SeedSchema<T>) => Promise<void>;
  login: (
    user: string,
    options?: { waitForRoot?: boolean; page?: Page; password?: string }
  ) => Promise<void>;
  logout: (page?: Page) => Promise<void>;
  exampleUser: UserData;
  fillSignupForm: (user: Partial<UserData>, submit?: boolean) => Promise<void>;
  blobService: BlobStorageService;
};

export const test = base.extend<CustomFixtures>({
  dbService: async ({}, use) => {
    await use(await e2eDatabases.dbService(dbName(base.info())));
  },
  seedAll: async ({}, use) => {
    const seedAll = async <T extends string>(schema?: SeedSchema<T>) => {
      await Promise.all(
        Array.from(Array(WORKERS), (_, i) => i + 1).map(async (i) => {
          await e2eDatabases.seedDbDispose(dbName(i), schema);
        })
      );
    };
    await use(seedAll);
  },
  clearDB: async ({}, use) => {
    const clearDb = () => e2eDatabases.clearDB(dbName(base.info()));
    await use(clearDb);
  },
  seedDB: async ({}, use) => {
    const seedDb = <T extends string>(schema?: SeedSchema<T>) =>
      e2eDatabases.seedDbDispose(dbName(base.info()), schema);
    await use(seedDb);
  },
  exampleUser: async ({ browserName }, use) => {
    await use(exampleUser(base.info(), browserName));
  },
  fillSignupForm: async ({ page }, use) => {
    const setAvatar = async (page: Page, path: Maybe<ImageTypes>): Promise<void> => {
      if (!path) return;
      const addAvatar = new AddAvatarE2E(page);
      if (await addAvatar.croppedAvatar.avatar.isVisible()) {
        await addAvatar.removeImage();
      }
      await uploadFile({
        page,
        path,
        action: () => addAvatar.uploadButton.click()
      });
      await addAvatar.confirmCrop();
      await addAvatar.croppedAvatar.waitForImageLoad();
    };
    const fillSignupForm = async (arg: Partial<UserData>, submit = false) => {
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState("networkidle");
      for (const key of typedObjectKeys(arg)) {
        if (key === "avatar") {
          await setAvatar(page, arg[key]?.path);
          continue;
        }
        const prop = arg[key];

        if (!prop) continue;
        const input = page.getByPlaceholder(prop.placeholder, { exact: true });
        await input.fill(prop.value);
        await input.press("Tab");
      }
      if (submit) {
        const btn = page.getByRole("button", { name: "submit" });
        await btn.focus();
        await btn.click();
        await page.waitForLoadState("domcontentloaded");
      }
    };
    await use(fillSignupForm);
  },
  login: async ({ page }, use) => {
    const login = async (
      user: string,
      options?: { waitForRoot?: boolean; page?: Page; password?: string }
    ) => {
      const targetPage = options?.page ?? page,
        waitForRoot = options?.waitForRoot ?? true;

      if (!targetPage.url().includes("login")) {
        await targetPage.goto(LOGIN_ROUTE);
      }
      await expect(targetPage).toHaveURL(LOGIN_ROUTE);
      await targetPage.waitForLoadState("networkidle");

      const userField = targetPage.getByPlaceholder(LOGIN_MESSAGES.usernamePlaceholder),
        passwordField = targetPage.getByPlaceholder(LOGIN_MESSAGES.passwordPlaceholder);
      for (const [field, val] of [
        [userField, user],
        [passwordField, options?.password ?? `${user}-password`]
      ] as const) {
        await field.click({ delay: 50 });
        await field.fill(val);
        await sleep(30);
        await field.press("Tab");
      }
      const button = targetPage.getByRole("button", { name: "SUBMIT" });
      await expect(button).toBeEnabled();
      await button.click();
      if (waitForRoot) {
        await expect(targetPage).toHaveURL(ROOT_ROUTE);
      }
    };
    await use(login);
  },
  logout: async ({ page }, use) => {
    await use(async (pageParam?: Page) => {
      const targetPage = pageParam ?? page;
      await targetPage.goto(ROOT_ROUTE);
      await targetPage.getByRole("button", { name: "Logout" }).click();
      await expect(targetPage).toHaveURL("/login");
    });
  },
  baseURL: async ({}, use) => {
    await use(`http://localhost:${BASE_PORT + base.info().parallelIndex}`);
  },
  blobService: async ({}, use) => {
    await use(e2eDatabases.getBlobService(dbName(base.info())));
  }
});
