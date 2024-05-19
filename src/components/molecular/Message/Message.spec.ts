import { render, screen, waitFor } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Message from "./Message.svelte";
import { CONVERSATION_MESSAGES } from "../../../messages";
import type { ComponentProps } from "svelte";
import type { RemoveIndexSignature } from "../../../types";

describe("Message", () => {
  const date = new Date("2024-01-01");
  const message = "Message",
    multiLineMessage = "Message\non\nthree lines";
  it("Shows message", async () => {
    render(Message, { message, date });
    await waitFor(() => {
      expect(screen.queryByText(message)).toBeInTheDocument();
    });
  });
  it("Each new line is its own paragraph", async () => {
    const { container } = render(Message, { message: multiLineMessage, date });
    await waitFor(() => {
      multiLineMessage.split("\n").forEach((line) => {
        expect(screen.queryByText(line)).toBeInTheDocument();
      });
      expect(container.querySelectorAll("article p")).toHaveLength(3);
    });
  });
  it("Displays date", async () => {
    render(Message, { message, date });
    await waitFor(() => {
      expect(screen.queryByLabelText(CONVERSATION_MESSAGES.publishedAt)).toBeInTheDocument();
    });
  });
  it("Displays message author", async () => {
    const author = "Name Surname";
    for (const hasAuthor of [false, true]) {
      const args: RemoveIndexSignature<ComponentProps<Message>> = { message, date };
      if (hasAuthor) {
        args.author = author;
      }
      render(Message, args);
      await waitFor(() => {
        const label = screen.queryByLabelText(CONVERSATION_MESSAGES.from),
          authorText = screen.queryByText(author);

        [label, authorText].forEach((locator) => {
          if (hasAuthor) {
            expect(locator).toBeInTheDocument();
          } else {
            expect(locator).not.toBeInTheDocument();
          }
        });
      });
    }
  });
});
