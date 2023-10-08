import type { Auth, BaseDateColumns } from "@db";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

export type CredentialsResult = Omit<Auth, BaseDateColumns> | null;

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
export const VERIFICATION_FAILURE = "User name or password did not match";

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

export const generateCookieToken = (userId: string): string =>
  pbkdf2Sync(userId, randomBytes(64).toString("hex"), 10_000, 64, "sha512").toString("hex");

export const verifyUser = async (
  username: string,
  password: string,
  dbService: { getCredentials(username: string): Promise<CredentialsResult> }
): Promise<string | null> => {
  const { digest, iterations, keylen, toStringType } = PBKDF;
  try {
    const credentials = await dbService.getCredentials(username);

    if (!credentials) {
      console.log(VERIFICATION_FAILURE);
      return null;
    }

    const { hash, salt } = credentials;
    const verificationHash = pbkdf2Sync(password, salt, iterations, keylen, digest).toString(
      toStringType
    );
    const encoder = new TextEncoder();
    const isEqual = timingSafeEqual(encoder.encode(verificationHash), encoder.encode(hash));

    if (isEqual) {
      return credentials.id;
    }
    console.log(VERIFICATION_FAILURE);
    return null;
  } catch (err) {
    console.log("Something went wrong...", err instanceof Error ? err.message : err);
    return null;
  }
};
