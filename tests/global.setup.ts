import { exec } from "child_process";
import { resolve } from "path";
import { WORKERS } from "../playwright.config.js";
import { e2eDatabases } from "./utils.js";

const populate = async () => {
  for (const name of Array.from(Array(WORKERS), (_v, i) => `chat_test_${i + 1}`)) {
    await e2eDatabases.createTestDB(name);
    await e2eDatabases.seedDbDispose(name);
  }
};

async function globalSetup() {
  exec(`npx pm2 start ${resolve(import.meta.dirname, "./ecosystem.config.cjs")}`, (err) => {
    if (err) {
      console.error(err);
    }
  });
  await populate();
}

export default globalSetup;
