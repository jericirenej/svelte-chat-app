import { describe, expect, it } from "vitest";

describe("sum test", () => {
  it("Window should be defined", () => {
    expect(typeof window).not.toBe("undefined");
  });
});
