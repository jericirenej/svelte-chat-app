import { render, waitFor } from "@testing-library/svelte";
import { add, milliseconds } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MessageDate from "./MessageDate.svelte";
import * as handler from "./dateHandler";
const { handleDate } = handler;

describe("MessageDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-04-01T12:00"));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Should update display and title", async () => {
    const date = add(new Date(), { minutes: 1 }),
      locale = "en-US";
    const { container } = render(MessageDate, {
      props: { date, locale }
    });
    for (const advance of [
      0,
      // To present
      6e4,
      // 1 minute
      6e4,
      // 2 minutes
      6e4,
      // 1 hour
      milliseconds({ minutes: 58 })
    ]) {
      vi.advanceTimersByTime(advance);
      await waitFor(() => {
        const p = container.querySelector("p");
        const { display, title } = handleDate({ date, locale });
        expect(p).toBeInTheDocument();
        expect(p).toHaveTextContent(display);
        expect(p?.title).toBe(title);
      });
    }
  });
  it("Should only update for up to 1 hour", async () => {
    const date = new Date(),
      locale = "en-US",
      display = new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "numeric",
        hourCycle: "h24"
      }).format(date);
    const { container } = render(MessageDate, {
      props: { date, locale }
    });
    for (const advance of [milliseconds({ hours: 1 }), milliseconds({ weeks: 2 })]) {
      vi.advanceTimersByTime(advance);
      await waitFor(() => {
        const p = container.querySelector("p");
        expect(p).toHaveTextContent(display);
      });
    }
  });
  it("Should have proper display of dates older than 1 hour", async () => {
    const locale = "en-US";
    const testCases: { advance: number; dateConfig: Intl.DateTimeFormat }[] = [
      {
        advance: milliseconds({ hours: 2 }),
        dateConfig: new Intl.DateTimeFormat(locale, {
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h24"
        })
      },
      {
        advance: milliseconds({ days: 2 }),
        dateConfig: new Intl.DateTimeFormat(locale, {
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h24",
          day: "numeric",
          month: "numeric"
        })
      },
      {
        advance: milliseconds({ weeks: 1 }),
        dateConfig: new Intl.DateTimeFormat(locale, {
          hourCycle: "h24",
          day: "numeric",
          month: "numeric"
        })
      },
      {
        advance: milliseconds({ years: 1 }),
        dateConfig: new Intl.DateTimeFormat(locale, {
          hourCycle: "h24",
          day: "numeric",
          month: "numeric",
          year: "2-digit"
        })
      }
    ];
    for (const { advance, dateConfig } of testCases) {
      const date = new Date();
      vi.advanceTimersByTime(advance);
      const { container } = render(MessageDate, {
        props: { date, locale }
      });
      await waitFor(() => {
        expect(container.querySelector("p")).toHaveTextContent(dateConfig.format(date));
      });
    }
  });
  it("Locale should be passed to handleDate", () => {
    const locales = ["en-US", "de-DE", "sl-SI"],
      date = new Date();
    for (const locale of locales) {
      const spyOnHandler = vi.spyOn(handler, "handleDate");
      render(MessageDate, {
        props: { date, locale }
      });
      expect(spyOnHandler).toHaveBeenLastCalledWith({ date, locale });
    }
  });
});
