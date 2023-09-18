import { exec } from "child_process";
import { promisify } from "util";

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
