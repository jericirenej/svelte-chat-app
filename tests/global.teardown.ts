import { redisService, seed } from "../db/index";

async function globalTeardown() {
  await redisService.deleteAll();
  await seed();
}

export default globalTeardown;
