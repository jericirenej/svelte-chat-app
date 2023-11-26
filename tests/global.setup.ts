import { seed } from "../db/index.js";
async function globalSetup() {
  await seed();
}

export default globalSetup;
