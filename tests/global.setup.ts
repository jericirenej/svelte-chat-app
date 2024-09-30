import { exec } from "child_process";
import { e2eDatabases } from "./utils.js";
import { resolve } from "path";

const populate = async () => {
  for (const name of Array.from(Array(4), (v, i) => `chat_test_${i + 1}`)) {
    await e2eDatabases.createTestDB(name);
    await e2eDatabases.seedDbDispose(name);
  }
};

async function globalSetup() {
  exec(`npx pm2 start ${resolve(import.meta.dirname, "./ecosystem.json")}`, (err) => {
    if (err) {
      console.error(err);
    }
  });
  await populate();
}

export default globalSetup;
