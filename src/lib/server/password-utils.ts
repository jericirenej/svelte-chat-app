import { SERVER_SECRET } from "$env/static/private";
import { PBKDF } from "@utils/generate-password.js";
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import type { AuthDto } from "../../../db/index.js";
export const VERIFICATION_FAILURE = "User name or password did not match";

/** Verify that two strings match in constant time. */
export const verifyInConstantTime = (first: string, second: string): boolean => {
  const encoder = new TextEncoder();
  try {
    return timingSafeEqual(encoder.encode(first), encoder.encode(second));
  } catch {
    // If we need to catch the error, it most likely means that the converted strings
    // do not resolve to the same buffer byte lengths. Which, by definition means, they
    // are unequal and should be evaluated as false.
    return false;
  }
};

export const verifyUser = async (
  username: string,
  password: string,
  dbService: { getCredentials(username: string): Promise<AuthDto | undefined> }
): Promise<string | null> => {
  const { digest, iterations, keylen, toStringType } = PBKDF;
  try {
    const credentials = await dbService.getCredentials(username);

    if (!credentials) {
      console.log(VERIFICATION_FAILURE);
      return null;
    }

    const { hash: originalHash, salt } = credentials;
    const verificationHash = pbkdf2Sync(password, salt, iterations, keylen, digest).toString(
      toStringType
    );
    const isEqual = verifyInConstantTime(originalHash, verificationHash);

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

export const generateSessionId = (id: string): string => {
  return pbkdf2Sync(id, randomBytes(64).toString("hex"), 10_000, 64, "sha512").toString("hex");
};

export const generateHmac = (message: string) => {
  const hmacGenerator = createHmac("sha-512", SERVER_SECRET);
  return hmacGenerator.update(message).digest().toString("hex");
};

export const generateCsrfToken = (sessionId: string) => {
  const randomValue = randomBytes(32).toString("hex");
  const message = `${sessionId}!${randomValue}`;
  const hmac = generateHmac(message);
  return [hmac, message].join(".");
};
export const verifyCsrfToken = (token: string): boolean => {
  const splitToken = token.split(".");
  if (splitToken.length !== 2) return false;
  const [hmac, message] = splitToken;
  const computedHmac = generateHmac(message);
  return verifyInConstantTime(hmac, computedHmac);
};

export const getSessionFromCsrfToken = (token: string): string => {
  try {
    const firstSplit = token.split(".")[1];
    const secondSplit = firstSplit.split("!");
    if (secondSplit.length !== 2) throw new Error();
    return secondSplit[0];
  } catch {
    return "";
  }
};
