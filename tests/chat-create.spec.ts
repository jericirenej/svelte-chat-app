import { LABEL_MIN } from "$lib/client/createChat.validator";
import { expect, type Locator } from "@playwright/test";
import { CHAT_ROUTE, CREATE_CHAT_ROUTE } from "../src/constants";
import { CREATE_CHAT, ENTITY_LIST, PREVIEW_LIST_NO_MESSAGES } from "../src/messages";
import { test } from "./fixtures";

test("Clicking on add icon navigates to chat create", async ({ page, login, logout, seedDB }) => {
  await seedDB({ chats: [] });
  await login("lovelace");
  const createChat = page.getByTitle(CREATE_CHAT.title);
  await expect(createChat).toBeVisible();
  await createChat.click();
  await expect(page).toHaveURL(CREATE_CHAT_ROUTE);
  await logout();
});
test.describe("On create chat page", () => {
  let submit: Locator, participantsAutocomplete: Locator, chatLabel: Locator;
  test.beforeEach(async ({ page, seedDB, login }) => {
    await seedDB({ chats: [] });
    await login("lovelace");
    await page.goto(CREATE_CHAT_ROUTE);
    submit = page.getByRole("button", { name: CREATE_CHAT.submitText });
    participantsAutocomplete = page.getByPlaceholder(ENTITY_LIST.searchPlaceholder);
    chatLabel = page.getByPlaceholder(CREATE_CHAT.chatLabel);
  });
  test.afterEach(async ({ logout, clearDB }) => {
    await logout();
    await clearDB();
  });
  test("Direct navigation to create allowed", async ({ page }) => {
    await expect(page).toHaveURL(CREATE_CHAT_ROUTE);
  });
  test("Create page has appropriate elements", async ({ page }) => {
    await expect(page).toHaveTitle(CREATE_CHAT.pageTitle);
    await expect(submit).toBeVisible();
    await expect(chatLabel).toBeVisible();
    await expect(participantsAutocomplete).toBeVisible();
  });
  test("Creating chat redirects to chat page and shows it in preview", async ({ page }) => {
    await participantsAutocomplete.fill("Charles");
    await page.getByText("Charles Babbage").click();
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page).toHaveURL(new RegExp(`${CHAT_ROUTE}/.+`));
    await expect(page.getByRole("heading", { level: 3, name: "Charles Babbage" })).toBeVisible();
    await expect(page.getByText(PREVIEW_LIST_NO_MESSAGES)).toBeVisible();
  });
  test("Creating chat with empty label text falls back to displaying participant in preview", async ({
    page
  }) => {
    await participantsAutocomplete.fill("Charles");
    await page.getByText("Charles Babbage").click();
    await chatLabel.fill("something");
    await chatLabel.clear();
    await submit.click();
    await expect(page.getByRole("heading", { level: 3, name: "Charles Babbage" })).toBeVisible();
  });
  test("Disallows submit if chat label too short", async ({ page }) => {
    await participantsAutocomplete.fill("Charles");
    await page.getByText("Charles Babbage").click();
    await expect(submit).toBeEnabled();
    await chatLabel.fill(
      Array(LABEL_MIN - 1)
        .fill("a")
        .join("")
    );
    await chatLabel.blur();
    await expect(submit).toBeDisabled();
    await expect(chatLabel).toHaveAttribute("aria-invalid");
    await chatLabel.fill(Array(LABEL_MIN).fill("a").join(""));
    await expect(chatLabel).not.toHaveAttribute("aria-invalid");
    await expect(submit).toBeEnabled();
  });
});
