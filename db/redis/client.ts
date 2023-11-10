import { createClient } from "redis";
import env from "../environment.js";

const clientConnection = () => createClient({ password: env.REDIS_HOST_PASSWORD });
const redisClient = clientConnection();

redisClient.on("error", (err) => {
  console.log("Redis Client Error: ", err);
});

export { clientConnection, redisClient };

export type RedisClient = typeof redisClient;
