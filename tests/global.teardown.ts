import {redisService} from "../db/index"

async function globalTeardown() {
    await redisService.deleteAll();
}

export default globalTeardown;