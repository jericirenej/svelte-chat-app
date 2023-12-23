import { exec } from "child_process";
import { randomUUID } from "crypto";
import { promisify } from "util";
import { platform } from "node:os";

export const resolveUrlPath = (url: URL): string =>
  !(platform() === "win32") ? url.pathname : url.pathname.substring(1);

export const asyncExec = async (
  command: string
): Promise<{
  stdout: string | null;
  stderr: string | null;
}> => {
  return await promisify(exec)(command);
};

export const typedJsonClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj)) as T;

export const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** UUID's should never match, but just in case, let's make sure and create a unique one. */
export const uniqueUUID = (references: string[]): string => {
  let newUUID = "";
  let counter = 0;
  while (!newUUID || references.includes(newUUID)) {
    newUUID = randomUUID();
    // Safety check
    if (counter > 100) {
      throw new Error("Error creating unique UUID");
    }
    counter++;
  }
  return newUUID;
};
