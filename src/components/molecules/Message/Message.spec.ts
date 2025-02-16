import { render, screen, waitFor } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Message from "./Message.svelte";
import type { ComponentProps } from "svelte";
import type { RemoveIndexSignature } from "../../../types";
import { handleDate } from "../MessageDate/dateHandler";

describe("Message", () => {
  const createdAt = new Date("2024-01-01");
  const message = "Message",
    multiLineMessage = "Message\non\nthree lines";
  it("Shows message", async () => {
    render(Message, { message, createdAt });
    await waitFor(() => {
      expect(screen.queryByText(message)).toBeInTheDocument();
    });
  });
  it("Each new line is its own paragraph", async () => {
    const { container } = render(Message, { message: multiLineMessage, createdAt });
    await waitFor(() => {
      multiLineMessage.split("\n").forEach((line) => {
        expect(screen.queryByText(line)).toBeInTheDocument();
      });
      expect(container.querySelectorAll("article p")).toHaveLength(3);
    });
  });
  it("Displays date", async () => {
    render(Message, { message, createdAt });
    const { title } = handleDate({ date: createdAt, locale: "en-US" });
    await waitFor(() => {
      expect(screen.queryByTitle(title)).toBeInTheDocument();
    });
  });
  it("Displays message author", async () => {
    const author = "Name Surname";
    for (const hasAuthor of [false, true]) {
      const args: RemoveIndexSignature<ComponentProps<Message>> = { message, createdAt };
      if (hasAuthor) {
        args.author = author;
      }
      render(Message, args);
      await waitFor(() => {
        const authorText = screen.queryByText(author);
        if (hasAuthor) {
          expect(authorText).toBeInTheDocument();
        } else {
          expect(authorText).not.toBeInTheDocument();
        }
      });
    }
  });
});
