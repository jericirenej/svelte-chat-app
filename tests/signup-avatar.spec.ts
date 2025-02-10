import { avatarBucketPath, avatarClientUrl } from "$lib/client/avatar-url";
import { expect } from "@playwright/test";
import { AddAvatarE2E } from "../src/components/organic/AddAvatar/AddAvatar.e2e";
import { PROFILE_ROUTE, ROOT_ROUTE, SIGNUP_ROUTE } from "../src/constants";
import { test } from "./fixtures";
test.beforeEach(async ({ page, clearDB }) => {
  await clearDB();
  await page.goto(SIGNUP_ROUTE);
});

test.afterAll(async ({ clearDB }) => {
  await clearDB();
});

test("Allows submission without avatar", async ({ page, fillSignupForm, exampleUser }) => {
  await fillSignupForm(
    {
      ...exampleUser,
      avatar: { path: null }
    },
    true
  );
  await expect(page).toHaveURL(ROOT_ROUTE);
});
test("Can remove avatar image", async ({ page, exampleUser, fillSignupForm }) => {
  await fillSignupForm(exampleUser);
  const addAvatar = new AddAvatarE2E(page);
  await addAvatar.removeImage();
  await expect(addAvatar.uploadButton).toBeVisible();
});
test("Avatar set in bucket and shown in profile", async ({
  page,
  blobService,
  fillSignupForm,
  exampleUser
}) => {
  const userName = "blobuser";
  await fillSignupForm(
    {
      ...exampleUser,
      username: { ...exampleUser.username, value: userName }
    },
    true
  );
  await expect(page).toHaveURL(ROOT_ROUTE);
  await expect(blobService.objectExists(avatarBucketPath(userName))).resolves.toBeTruthy();
  await page.goto(PROFILE_ROUTE);
  await expect(page.getByRole("img", { name: `${userName} avatar` })).toHaveAttribute(
    "src",
    avatarClientUrl(userName)
  );
});
