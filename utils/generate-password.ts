import * as crypto from "crypto";
import { pbkdf2Sync, randomBytes } from "crypto";

export type PbkdfSettings = {
  iterations: number;
  keylen: number;
  randomBytesLength: number;
  digest: string;
  toStringType: BufferEncoding;
};

export const PBKDF: PbkdfSettings = {
  iterations: 10_000,
  keylen: 128,
  randomBytesLength: 64,
  digest: "sha512",
  toStringType: "base64url"
};

export const genPassword = (
  password: string,
  setting: PbkdfSettings = PBKDF
): Record<"hash" | "salt", string> => {
  const { digest, iterations, keylen, toStringType, randomBytesLength } = setting;
  const salt = randomBytes(randomBytesLength).toString(toStringType);
  const hash = pbkdf2Sync(password, salt, iterations, keylen, digest).toString(toStringType);
  return {
    salt,
    hash
  };
};

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;
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
}
