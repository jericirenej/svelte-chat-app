import { exec } from "child_process";
import { redisService } from "../db/index";
import { e2eDatabases } from "./utils";

async function globalTeardown() {
  await redisService.deleteAll();
  await e2eDatabases.cleanup();
  exec(`npx pm2 delete all`, (err) => {
    if (err) {
      console.error(err);
    }
  });
}

export default globalTeardown;
