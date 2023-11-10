import * as crypto from "crypto";

import { afterEach, beforeEach, describe, expect, it, vi, type SpyInstance } from "vitest";
import {
  PBKDF,
  VERIFICATION_FAILURE,
  genPassword,
  generateCsrfToken,
  getSessionFromCsrfToken,
  verifyCsrfToken,
  verifyInConstantTime,
  verifyUser
} from "./password-utils.js";

import type { AuthDto } from "../../../db/index.js";

vi.mock("node:crypto", async () => {
  const original = await vi.importActual<typeof import("node:crypto")>("node:crypto");
  return { ...original };
});

vi.mock("$env/static/private", () => ({ SERVER_SECRET: "mock-secret" }));

describe("genPassword", () => {
  it("Should generate hash and salt with appropriate arguments", () => {
    const spyOnPbkdf = vi.spyOn(crypto, "pbkdf2Sync"),
      spyOnRandomBytes = vi.spyOn(crypto, "randomBytes");
    const spyOnBufferToString = vi.spyOn(Buffer.prototype, "toString");
    const settings = { ...PBKDF },
      password = "password";
    const { hash, salt } = genPassword(password, settings);
    expect(salt).toBeTruthy();
    expect(hash).toBeTruthy();
    expect(spyOnRandomBytes).toHaveBeenLastCalledWith(settings.randomBytesLength);
    expect(spyOnPbkdf).toHaveBeenLastCalledWith(
      password,
      salt,
      settings.iterations,
      settings.keylen,
      settings.digest
    );
    expect(spyOnBufferToString).toHaveBeenCalledTimes(2);

    expect(spyOnBufferToString.mock.calls.flat(Infinity)).toEqual(
      new Array(2).fill(settings.toStringType)
    );
    vi.restoreAllMocks();
  });
});

describe("verifyInConstantTime", () => {
  const first1 = "first1",
    first2 = "first2";
  it("Should verify string equality", () => {
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
  let spyOnConsole: SpyInstance,
    spyOnCredentials: SpyInstance<[username: string], Promise<AuthDto | undefined>>;
  beforeEach(() => {
    spyOnConsole = vi.spyOn(console, "log").mockImplementation((message?: unknown) => {});
    spyOnCredentials = vi.spyOn(mockDbService, "getCredentials");
  });
  afterEach(() => {
    spyOnConsole.mockRestore();
  });
  it("Should return null if username is not found and report mismatch", async () => {
    expect(await verifyUser(username, password, mockDbService)).toBeNull();
    expect(spyOnConsole).toHaveBeenCalledWith(VERIFICATION_FAILURE);
  });
  it("Should return null if verification fails and report mismatch", async () => {
    spyOnCredentials.mockResolvedValueOnce({ hash, salt, id, createdAt, updatedAt });
    expect(await verifyUser(username, invalid, mockDbService)).toBeNull();
    expect(spyOnConsole).toHaveBeenCalledWith(VERIFICATION_FAILURE);
  });
  it("Should return id, if verification succeeds", async () => {
    spyOnCredentials.mockResolvedValueOnce({ hash, salt, id, createdAt, updatedAt });
    expect(await verifyUser(username, password, mockDbService)).toBe(id);
    expect(spyOnConsole).not.toHaveBeenCalled();
  });
  it("If function throws, should return null and report gracefully", async () => {
    spyOnCredentials.mockRejectedValueOnce(new Error("error"));
    expect(await verifyUser(username, password, mockDbService)).toBeNull();
    expect(spyOnConsole).toHaveBeenCalledOnce();
    expect(spyOnConsole).toHaveBeenCalledWith("Something went wrong...", "error");
  });
});

describe("CSRF token", () => {
  const sessionId = "sessionId";
  it("Should create a CSRF token", () => {
    const csrfToken = generateCsrfToken(sessionId);
    const splitToken = csrfToken.split(".");
    expect(splitToken.length).toBe(2);
    expect(splitToken[1].includes("!"));
  });
  it("Successively created CSRF tokens with identical sessionId should not be equal because of random seeds", () => {
    expect(generateCsrfToken(sessionId)).not.toEqual(generateCsrfToken(sessionId));
  });
  it("Should return true, if an identical CSRF token is supplied", () => {
    const csrfToken = generateCsrfToken(sessionId);
    expect(verifyCsrfToken(csrfToken)).toBe(true);
  });
  it("Should return false if part of token is missing", () => {
    const csrfToken = generateCsrfToken(sessionId);
    const split = csrfToken.split(".");
    expect(verifyCsrfToken(split[1])).toBe(false);
  });
  it("Should return false, if any part of the message has been changed", () => {
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
  it("Should extract session from token", () => {
    const csrfToken = generateCsrfToken(sessionId);
    expect(getSessionFromCsrfToken(csrfToken)).toBe(sessionId);
  });
  it("If token is malformed, return empty string", () => {
    for (const malformed of ["malformed", "hmac.withoutExclamation"]) {
      expect(getSessionFromCsrfToken(malformed)).toBe("");
    }
  });
});
