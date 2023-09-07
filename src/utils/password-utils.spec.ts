import * as crypto from "crypto";

import { afterEach, beforeEach, describe, expect, it, vi, type SpyInstance } from "vitest";
import {
  PBKDF,
  VERIFICATION_FAILURE,
  genPassword,
  verifyUser,
  type CredentialsResult
} from "./password-utils.js";

vi.mock("node:crypto", async () => {
  const original = await vi.importActual<typeof import("node:crypto")>("node:crypto");
  return { ...original };
});

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

describe("verifyUser", () => {
  const username = "username",
    password = "password",
    invalid = "invalid",
    id = "id";
  const { hash, salt } = genPassword(password);
  const mockDbService = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getCredentials(username: string): Promise<CredentialsResult> {
      return Promise.resolve(null);
    }
  };
  let spyOnConsole: SpyInstance,
    spyOnCredentials: SpyInstance<[username: string], Promise<CredentialsResult>>;
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
    spyOnCredentials.mockResolvedValueOnce({ hash, salt, id });
    expect(await verifyUser(username, invalid, mockDbService)).toBeNull();
    expect(spyOnConsole).toHaveBeenCalledWith(VERIFICATION_FAILURE);
  });
  it("Should return id, if verification succeeds", async () => {
    spyOnCredentials.mockResolvedValueOnce({ hash, salt, id });
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
