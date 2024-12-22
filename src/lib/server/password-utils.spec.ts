import * as crypto from "crypto";

vi.mock("node:crypto", async () => {
  const original = await vi.importActual<typeof import("node:crypto")>("node:crypto");
  return { ...original };
});

import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import {
  VERIFICATION_FAILURE,
  generateCsrfToken,
  getSessionFromCsrfToken,
  verifyCsrfToken,
  verifyInConstantTime,
  verifyUser
} from "./password-utils.js";

import { genPassword } from "@utils/generate-password.js";
import type { AuthDto } from "../../../db/index.js";

vi.mock("node:crypto", async () => {
  const original = await vi.importActual<typeof import("node:crypto")>("node:crypto");
  return { ...original };
});

vi.mock("$env/static/private", () => ({ SERVER_SECRET: "mock-secret" }));

describe("verifyInConstantTime", () => {
  const first1 = "first1",
    first2 = "first2";
  it("Verifies string equality", () => {
    expect(verifyInConstantTime(first1, first2)).toBe(false);
    expect(verifyInConstantTime(first1, first1)).toBe(true);
  });
});

describe("verifyUser", () => {
  const username = "username",
    password = "password",
    invalid = "invalid",
    id = "id";
  const { hash, salt } = genPassword(password);
  const createdAt = new Date(2020, 12, 31),
    updatedAt = createdAt;
  const mockDbService = {
    async getCredentials(username: string): Promise<AuthDto | undefined> {
      return Promise.resolve(undefined);
    }
  };
  let spyOnConsole: MockInstance,
    spyOnCredentials: MockInstance<(username: string) => Promise<AuthDto | undefined>>;
  beforeEach(() => {
    spyOnConsole = vi.spyOn(console, "log").mockImplementation((message?: unknown) => {});
    spyOnCredentials = vi.spyOn(mockDbService, "getCredentials");
  });
  afterEach(() => {
    spyOnConsole.mockRestore();
  });
  it("Returns null if username is not found and report mismatch", async () => {
    expect(await verifyUser(username, password, mockDbService)).toBeNull();
    expect(spyOnConsole).toHaveBeenCalledWith(VERIFICATION_FAILURE);
  });
  it("Returns null if verification fails and report mismatch", async () => {
    spyOnCredentials.mockResolvedValueOnce({ hash, salt, id, createdAt, updatedAt });
    expect(await verifyUser(username, invalid, mockDbService)).toBeNull();
    expect(spyOnConsole).toHaveBeenCalledWith(VERIFICATION_FAILURE);
  });
  it("Returns id, if verification succeeds", async () => {
    spyOnCredentials.mockResolvedValueOnce({ hash, salt, id, createdAt, updatedAt });
    expect(await verifyUser(username, password, mockDbService)).toBe(id);
    expect(spyOnConsole).not.toHaveBeenCalled();
  });
  it("Returns null and reports gracefully if function throws", async () => {
    spyOnCredentials.mockRejectedValueOnce(new Error("error"));
    expect(await verifyUser(username, password, mockDbService)).toBeNull();
    expect(spyOnConsole).toHaveBeenCalledOnce();
    expect(spyOnConsole).toHaveBeenCalledWith("Something went wrong...", "error");
  });
});

describe("CSRF token", () => {
  const sessionId = "sessionId";
  it("Creates a CSRF token", () => {
    const csrfToken = generateCsrfToken(sessionId);
    const splitToken = csrfToken.split(".");
    expect(splitToken.length).toBe(2);
    expect(splitToken[1].includes("!"));
  });
  it("Random seeds distinguish successively created CSRF tokens with identical sessionId", () => {
    expect(generateCsrfToken(sessionId)).not.toEqual(generateCsrfToken(sessionId));
  });
  it("Returns true, if an identical CSRF token is supplied", () => {
    const csrfToken = generateCsrfToken(sessionId);
    expect(verifyCsrfToken(csrfToken)).toBe(true);
  });
  it("Returns false if part of token is missing", () => {
    const csrfToken = generateCsrfToken(sessionId);
    const split = csrfToken.split(".");
    expect(verifyCsrfToken(split[1])).toBe(false);
  });
  it("Returns false, if any part of the message has been changed", () => {
    const csrfToken = generateCsrfToken(sessionId);
    const [hmac, token] = csrfToken.split(".");

    const alteredToken = token.replace(sessionId, "sessionId1");
    let alteredHmac = hmac;
    while (alteredHmac === hmac) {
      alteredHmac = crypto.randomBytes(hmac.length).toString("hex");
    }
    expect(verifyCsrfToken([hmac, alteredToken].join("."))).toBe(false);
    expect(verifyCsrfToken([alteredHmac, token].join("."))).toBe(false);
  });
  it("Extractssession from token", () => {
    const csrfToken = generateCsrfToken(sessionId);
    expect(getSessionFromCsrfToken(csrfToken)).toBe(sessionId);
  });
  it("Returns empty string for malformed token", () => {
    for (const malformed of ["malformed", "hmac.withoutExclamation"]) {
      expect(getSessionFromCsrfToken(malformed)).toBe("");
    }
  });
});
