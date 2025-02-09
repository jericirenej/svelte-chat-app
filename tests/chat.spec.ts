import { getNameOrUsername } from "$lib/client/participant-map";
import { type UserNames } from "@db/postgres/seed/default-seed";
import type { ChatSchema } from "@db/postgres/seed/seed";
import { expect, type Locator, type Page } from "@playwright/test";
import { BASE_USERS, v5 } from "@utils/users";
import { add } from "date-fns";
import MESSAGES from "../db/postgres/seed/seed.messages";
import { CHAT_ROUTE, MESSAGE_TAKE } from "../src/constants";
import { CONVERSATION_MESSAGES, TIME_DISPLAY_MESSAGES } from "../src/messages";
import { test, type CustomFixtures } from "./fixtures";
import { sleep } from "./utils";
import { handleUsers } from "$lib/client/typing-users-handler";
import type { ParticipantData } from "../src/types";
import { participantName } from "$lib/utils";

const date = new Date("2024-01-01T12:00:00");
const messageContainer = (page: Page) => page.getByLabel(CONVERSATION_MESSAGES.containerLabel);

const prefix = (index: number) => `Msg ${index + 1}`;
const prefixMessage = (msg: string, index: number) => [prefix(index), msg].join(": ");

const messages = Array.from(Array(40), (_, i) => {
  return {
    message: prefixMessage(MESSAGES[i], i),
    username: i === 39 ? "lovelace" : i === 38 ? "liskov" : "babbage",
    afterPrevious: 200
  };
}) satisfies ChatSchema<UserNames>["messages"];

const beforeEachHook = async ({
  seedDB,
  login,
  page
}: {
  seedDB: CustomFixtures["seedDB"];
  login: CustomFixtures["login"];
  page: Page;
}) => {
  await seedDB<UserNames>({
    chats: [
      {
        participants: ["lovelace", "babbage", "liskov"],
        messages,
        createdAt: date
      }
    ]
  });
  await login("lovelace");
  const url = [CHAT_ROUTE, v5("chat", 0)].join("/");
  await page.goto(url);
  await expect(page).toHaveURL(url);
};

const afterEachHook = async ({
  logout,
  clearDB
}: {
  logout: CustomFixtures["logout"];
  clearDB: CustomFixtures["clearDB"];
}) => {
  await logout();
  await clearDB();
};

const sendMessage = async (page: Page, message: string): Promise<Locator> => {
  await page.getByPlaceholder(CONVERSATION_MESSAGES.textPlaceholder).fill(message);
  await page.keyboard.press("Control+Enter");
  return messageContainer(page).locator("section", { has: page.getByText(message) });
};
test.describe("Send message", () => {
  test.beforeEach(async ({ seedDB, login, page }) => {
    await beforeEachHook({ seedDB, login, page });
  });
  test("Text area has placeholder message", async ({ page }) => {
    await expect(page.getByPlaceholder(CONVERSATION_MESSAGES.textPlaceholder)).toBeVisible();
  });
  test("Cannot send empty message", async ({ page }) => {
    const disabledButton = page.getByRole("button", { name: CONVERSATION_MESSAGES.sendEmpty });
    const enabledButton = page.getByRole("button", { name: CONVERSATION_MESSAGES.send });
    await expect(disabledButton).toBeVisible();
    await expect(disabledButton).toBeDisabled();

    await page.getByPlaceholder(CONVERSATION_MESSAGES.textPlaceholder).fill("something");
    await expect(disabledButton).toBeHidden();
    await expect(enabledButton).toBeVisible();
    await expect(enabledButton).toBeEnabled();

    await page.getByPlaceholder(CONVERSATION_MESSAGES.textPlaceholder).clear();
    await expect(enabledButton).toBeHidden();
    await expect(disabledButton).toBeVisible();
    await expect(disabledButton).toBeDisabled();
  });

  test("User can send by clicking send icon", async ({ page }) => {
    const message = "MESSAGE";
    await page.getByPlaceholder(CONVERSATION_MESSAGES.textPlaceholder).fill(message);
    await page.getByRole("button", { name: CONVERSATION_MESSAGES.send }).click();
    await expect(page.getByPlaceholder(CONVERSATION_MESSAGES.textPlaceholder)).toHaveValue("");
    const locator = messageContainer(page).locator("section", { has: page.getByText(message) });
    await (await locator.elementHandle())?.waitForElementState("stable");
    await expect(locator).toBeVisible();
  });
  test("User can send by Ctrl+Enter", async ({ page }) => {
    const message = "MESSAGE";
    await page.getByPlaceholder(CONVERSATION_MESSAGES.textPlaceholder).fill(message);
    await page.keyboard.press("Control+Enter");
    await expect(page.getByPlaceholder(CONVERSATION_MESSAGES.textPlaceholder)).toHaveValue("");
    const locator = messageContainer(page).locator("section", { has: page.getByText(message) });
    await (await locator.elementHandle())?.waitForElementState("stable");
    await expect(locator).toBeVisible();
  });
  test("User can send multiline messages", async ({ page }) => {
    await page.getByPlaceholder(CONVERSATION_MESSAGES.textPlaceholder).click();
    await page.keyboard.type("First line");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Second line");
    await page.keyboard.press("Control+Enter");
    const locator = messageContainer(page).locator("section", {
      has: page.getByText("First lineSecond line")
    });
    await sleep(300);
    await (await locator.elementHandle())?.waitForElementState("stable");
    await expect(locator).toBeVisible();
  });
});
test.describe("Message", () => {
  let container: Locator;
  const message = "A new message";
  const second = 1e3,
    minute = 60 * second;

  test.beforeEach(async ({ seedDB, login, page }) => {
    await page.clock.install({ time: new Date("2024-12-01T12:00:00") });
    await beforeEachHook({ seedDB, login, page });
    container = messageContainer(page);
  });
  test.afterEach(async ({ logout, clearDB }) => {
    await afterEachHook({ logout, clearDB });
  });

  test("New message is dated 'Now'", async ({ page }) => {
    await page.clock.setSystemTime(Date.now());
    const section = await sendMessage(page, message);
    await (await section.elementHandle())?.waitForElementState("stable");
    await expect(
      section.getByLabel(CONVERSATION_MESSAGES.publishedAt).getByRole("paragraph")
    ).toHaveText(TIME_DISPLAY_MESSAGES.now);
  });

  test("Age title and display formatted in current locale", async ({ page, browser, login }) => {
    const getLatestDateSection = (page: Page) =>
      messageContainer(page)
        .locator("section")
        .first()
        .getByLabel(CONVERSATION_MESSAGES.publishedAt);
    const lastMessageDate = add(date, { seconds: 40 * 200 });
    const baseConfig = { hourCycle: "h24", timeZone: "+00:00" } as const;
    const formattedDate = (locale: string) =>
      new Intl.DateTimeFormat(locale, {
        month: "numeric",
        day: "numeric",
        ...baseConfig
      }).format(lastMessageDate);
    const formattedTitle = (locale: string) =>
      new Intl.DateTimeFormat(locale, {
        timeStyle: "short",
        dateStyle: "medium",
        ...baseConfig
      }).format(lastMessageDate);
    const url = [CHAT_ROUTE, v5("chat", 0)].join("/");
    const slPage = await (await browser.newContext({ locale: "sl" })).newPage();
    await slPage.clock.install({ time: new Date("2024-12-01T12:00:00") });

    await login("lovelace", { page: slPage });
    await slPage.goto(url);

    for (const { pageRef, title, display } of [
      { pageRef: page, title: formattedTitle("en-US"), display: formattedDate("en-US") },
      { pageRef: slPage, title: formattedTitle("sl"), display: formattedDate("sl") }
    ]) {
      await expect(getLatestDateSection(pageRef).getByTitle(title)).toBeVisible();
      await expect(getLatestDateSection(pageRef).getByTitle(title)).toHaveText(display);
    }
  });

  test("Shows 'You' on own messages and usernames on others", async ({ page }) => {
    const getName = (username: string) => {
      const user = BASE_USERS.find((p) => p.username === username);
      if (!user) throw new Error();
      return getNameOrUsername(user);
    };
    for (const { index, expected } of [
      { index: 39, expected: CONVERSATION_MESSAGES.ownMessageAuthor },
      { index: 38, expected: getName("liskov") },
      { index: 37, expected: getName("babbage") }
    ]) {
      const bubble = container.locator("section", { has: page.getByText(prefix(index)) });
      await expect(bubble).toBeVisible();
      await expect(bubble.getByLabel(CONVERSATION_MESSAGES.from)).toHaveText(expected);
    }
  });
  test("User's messages are on the right, other participants' on the left", async ({ page }) => {
    for (const { nth, expected } of [
      { nth: 0, expected: /ml-auto/ },
      { nth: 1, expected: /mr-auto/ },
      { nth: 2, expected: /mr-auto/ }
    ]) {
      const bubble = container.getByRole("listitem").nth(nth);
      await expect(bubble).toBeVisible();
      await expect(bubble).toHaveClass(expected);
    }
  });
});
test.describe("Message list", () => {
  let container: Locator;
  test.describe("Lazy loading", () => {
    test.beforeEach(async ({ seedDB, login, page }) => {
      await beforeEachHook({ seedDB, login, page });
      container = messageContainer(page);
    });
    test.afterEach(async ({ clearDB, logout }) => {
      await afterEachHook({ clearDB, logout });
    });
    test("Loads initial number of messages", async () => {
      await expect(container.locator("section")).toHaveCount(MESSAGE_TAKE);
    });

    test("Loads more messages when scrolling to top", async () => {
      await (await container.elementHandle())?.waitForElementState("stable");
      await container.evaluate((e) => {
        e.scrollTo({ top: 0 });
      });
      await expect(container.locator("section")).toHaveCount(messages.length);
    });
  });
  test.describe("Notifications", () => {
    let liskovPage: Page;
    const message = "Some message";
    test.beforeEach(async ({ seedDB, login, page, browser }) => {
      await beforeEachHook({ seedDB, login, page });
      liskovPage = await (await browser.newContext()).newPage();
      await login("liskov", { page: liskovPage });
      await liskovPage.goto([CHAT_ROUTE, v5("chat", 0)].join("/"));
      container = messageContainer(page);
    });
    test.afterEach(async ({ clearDB, logout }) => {
      await logout(liskovPage);
      await afterEachHook({ clearDB, logout });
    });
    test("Typing indicator is displayed when other user is typing", async ({ page }) => {
      const liskovTyping = liskovPage
        .getByPlaceholder(CONVERSATION_MESSAGES.textPlaceholder)
        .pressSequentially("Something", { delay: 50 });
      const user = BASE_USERS.find((p) => p.username === "liskov");
      if (!user) throw new Error();
      const name = participantName(user as ParticipantData);
      await expect(
        page
          .locator(".chat-container")
          .locator(".typing-indicator")
          .getByText(handleUsers(name) as string)
      ).toBeVisible();
      await liskovTyping;
    });
    test("User is notified on new messages it they are not in view", async ({ page }) => {
      const notificationButton = page.getByTitle(CONVERSATION_MESSAGES.newMessagesInvisible);
      await (await container.elementHandle())?.waitForElementState("stable");
      await container
        .locator("section", { has: page.getByText(prefix(20)) })
        .scrollIntoViewIfNeeded();
      await expect(container.locator("section")).toHaveCount(messages.length);

      await expect(notificationButton).toBeHidden();

      await sendMessage(liskovPage, message);

      await expect(notificationButton).toBeVisible();
    });
    test("Clicking notification brings message in view", async ({ page }) => {
      const notificationButton = page.getByTitle(CONVERSATION_MESSAGES.newMessagesInvisible);
      await container
        .locator("section", { has: page.getByText(prefix(20)) })
        .scrollIntoViewIfNeeded();
      await expect(container.locator("section")).toHaveCount(messages.length);

      await expect(notificationButton).toBeHidden();
      await sendMessage(liskovPage, message);
      const newMessage = container.locator("section", { has: page.getByText(message) });
      await expect(newMessage).not.toBeInViewport();
      await notificationButton.click();
      await expect(newMessage).toBeInViewport();
    });
  });
});
