import { readFileSync } from "fs";

export const getEnv = () => {
  const envFile = readFileSync(new URL("../../.env", import.meta.url), "utf8");
  const lines = envFile.split(/\r?\n/).filter(Boolean);
  return lines.reduce<Record<string, string>>((envObj, line) => {
    const split = line.split("=");
    envObj[split[0]] = split[1];
    return envObj;
  }, {});
};

export const env = getEnv();
