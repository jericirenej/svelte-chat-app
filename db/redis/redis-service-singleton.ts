import { redisClient } from "./client";
import { RedisService } from "./redis-service";

const redisService = await RedisService.init(redisClient);
export { redisService };
