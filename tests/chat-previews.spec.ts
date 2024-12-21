import { getNameOrUsername } from "$lib/client/participant-map";
import { handleUsers } from "$lib/client/typing-users-handler";
import { participantName } from "$lib/utils";
import { type UserNames } from "@db/postgres/seed/default-seed";
import type { ChatSchema } from "@db/postgres/seed/seed";
import { expect, type Page } from "@playwright/test";
import { BASE_USERS, v5 } from "@utils/users";
import { add } from "date-fns";
import { CHAT_ROUTE, ROOT_ROUTE } from "../src/constants";
import {
  CONVERSATION_MESSAGES,
  PREVIEW_LIST_EMPTY,
  PREVIEW_LIST_NO_MESSAGES,
  PREVIEW_LIST_TITLE
} from "../src/messages";
import type { ParticipantData } from "../src/types";
import { test } from "./fixtures";

test.describe("Without chats", () => {
  test.beforeEach(async ({ seedDB, login }) => {
    await seedDB({ chats: [] });
    await login("lovelace");
  });
  test.afterEach(async ({ clearDB }) => {
    await clearDB();
  });
  test("Shows chat section title", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 2, name: PREVIEW_LIST_TITLE })).toBeVisible();
  });
  test("Shows placeholder message, if user has no chats", async ({ page }) => {
    await expect(page.getByText(PREVIEW_LIST_EMPTY)).toBeVisible();
  });
});
test.describe("With chats", () => {
  const chatListLocator = (page: Page) => page.getByLabel("Chat list");
  const chatItemLocator = (page: Page, index: number) =>
    chatListLocator(page).getByRole("listitem").nth(index);
  const unreadLocator = (page: Page, index: number) =>
    chatItemLocator(page, index).getByTitle(CONVERSATION_MESSAGES.unreadMessages);

  const baseDate = new Date("2024-12-01");
  const loggedUserChats: ChatSchema<UserNames>[] = [
    { participants: ["lovelace", "logician"], createdAt: baseDate },
    {
      participants: ["lovelace", "babbage", "liskov"],
      messages: [
        { message: "Message from lovelace", username: "lovelace" },
        {
          message: "Message from babbage",
          username: "babbage",
          createdAt: add(baseDate, { days: 3 })
        }
      ],
      createdAt: add(baseDate, { days: 1 })
    },
    {
      participants: ["lovelace", "chu_lonzo", "incomplete_guy"],
      name: "A named chat",
      messages: [{ message: "Message from chu_lonzo", username: "chu_lonzo" }],
      createdAt: add(baseDate, { days: 2 })
    }
  ] as const;
  const otherChat: ChatSchema<UserNames> = { participants: ["logician", "babbage"] };
  test.beforeEach(async ({ seedDB, login }) => {
    await seedDB({ chats: [...loggedUserChats, otherChat] });
    await login("lovelace");
  });
  test.afterEach(async ({ clearDB }) => {
    await clearDB();
  });
  test("Shows appropriate number of previews", async ({ page }) => {
    await expect(page.getByText(PREVIEW_LIST_EMPTY)).toBeHidden();
    await expect(chatListLocator(page)).toBeVisible();
    await expect(chatListLocator(page).getByRole("listitem")).toHaveCount(loggedUserChats.length);
  });
  test("Previews are ordered by newest first and have titles and last messages or placeholders", async ({
    page
  }) => {
    const reversed = loggedUserChats.toReversed();

    for (const [chat, nth] of reversed.map((c, i) => [c, i] as const)) {
      const locator = chatItemLocator(page, nth);
      const title =
        chat.name ??
        chat.participants
          .filter((p) => p === "lovelace")
          .map((p) => {
            const user = BASE_USERS.find(({ username }) => username === p);
            if (!user) {
              throw new Error();
            }
            getNameOrUsername(user);
          })
          .join(", ");
      const message = chat.messages?.length
        ? (chat.messages.at(-1)?.message as string)
        : PREVIEW_LIST_NO_MESSAGES;
      await expect(locator.getByRole("heading", { level: 3, name: title })).toBeVisible();
      await expect(locator.getByText(message)).toBeVisible();
    }
  });
  test("Clicking on preview redirects to chat page", async ({ page }) => {
    const targetChat = chatItemLocator(page, 0);
    await targetChat.click();
    // Last chat is latest, so we build id from last index
    // of inserted chats that is associated with the signed user
    const id = v5("chat", 2);
    await expect(page).toHaveURL(`${CHAT_ROUTE}/${id}`);
  });
  test("Previews show number of unread messages", async ({ page }) => {
    await expect(unreadLocator(page, 0)).toBeVisible();
    await expect(unreadLocator(page, 0).getByText("1")).toBeVisible();
    await expect(unreadLocator(page, 1)).toBeVisible();
    await expect(unreadLocator(page, 1).getByText("2")).toBeVisible();
    await expect(unreadLocator(page, 2)).toBeHidden();
  });
  test("No unread messages shown for directly navigated chat", async ({ page }) => {
    await page.goto([CHAT_ROUTE, v5("chat", 2)].join("/"));
    await expect(unreadLocator(page, 0)).toBeHidden();
  });
  test("Unread messages is cleared after visiting chat page and persists on reload", async ({
    page
  }) => {
    await expect(unreadLocator(page, 0)).toBeVisible();
    await expect(unreadLocator(page, 0).getByText("1")).toBeVisible();
    await chatItemLocator(page, 0).click();

    await expect(page).toHaveURL([CHAT_ROUTE, v5("chat", 2)].join("/"));
    await expect(chatItemLocator(page, 0)).toBeVisible();
    await expect(unreadLocator(page, 0)).toBeHidden();
    await page.goto(ROOT_ROUTE);
    await page.reload();
    await expect(chatItemLocator(page, 0)).toBeVisible();
    await expect(unreadLocator(page, 0)).toBeHidden();
  });
  test("Leaving chat makes it inaccessible", async ({ page }) => {
    const targetChat = chatItemLocator(page, 0).filter({
        has: page.getByText(loggedUserChats.at(-1)?.messages?.at(-1)?.message ?? "")
      }),
      targetButton = chatItemLocator(page, 0).getByRole("button", {
        name: CONVERSATION_MESSAGES.leaveChat
      });
    const id = v5("chat", 2),
      url = [CHAT_ROUTE, id].join("/");
    await page.goto(url);
    await expect(page).toHaveURL(url);

    await expect(targetButton).toBeVisible();
    await targetButton.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { level: 1, name: CONVERSATION_MESSAGES.leaveChat })
    ).toBeVisible();
    await expect(dialog.getByText(CONVERSATION_MESSAGES.leaveChatMessage)).toBeVisible();

    await dialog.getByRole("button", { name: "Yes" }).click();

    await expect(page).toHaveURL(ROOT_ROUTE);
    await expect(targetChat).toBeHidden();
    await page.goto(url);
    await expect(page).not.toHaveURL(url);
    await expect(page).toHaveURL(ROOT_ROUTE);
  });
  test.describe("Notification and new message push", () => {
    const id = v5("chat", 2),
      url = [CHAT_ROUTE, id].join("/");
    let godelPage: Page;
    test.beforeEach(async ({ browser, login }) => {
      godelPage = await (await browser.newContext()).newPage();
      await login("incomplete_guy", { page: godelPage });
      await godelPage.goto(url);
      await expect(godelPage).toHaveURL(url);
    });
    test.afterEach(async () => {
      await godelPage.getByRole("button", { name: "Logout" }).click();
    });
    test("Typing notification appears", async ({ page }) => {
      const targetChat = chatItemLocator(page, 0);
      const textArea = godelPage.getByPlaceholder(CONVERSATION_MESSAGES.textPlaceholder);
      await expect(textArea).toBeVisible();
      const writing = textArea.pressSequentially("Message", { delay: 30 });
      await expect(
        targetChat.getByText(
          handleUsers(
            participantName(
              BASE_USERS.find((u) => u.username === "incomplete_guy") as ParticipantData
            )
          ) as string
        )
      ).toBeVisible();
      await writing;
    });
    test("New message is shown in preview", async ({ page }) => {
      const message = "A new message";
      await godelPage.getByPlaceholder(CONVERSATION_MESSAGES.textPlaceholder).fill(message);
      await godelPage.keyboard.press("Control+Enter");
      await expect(chatItemLocator(page, 0).getByText(message)).toBeVisible();
    });
  });
});
