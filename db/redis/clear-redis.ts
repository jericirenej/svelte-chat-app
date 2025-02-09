import { redisService } from "./redis-service-singleton";

await redisService.connect();
await redisService.deleteAll();
await redisService.disconnect();
