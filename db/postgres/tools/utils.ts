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
