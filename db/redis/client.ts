import * as dotenv from "dotenv";
import { createClient } from "redis";
dotenv.configDotenv({ path: new URL("../../.env", import.meta.url).pathname.substring(1) });

export const clientConnection = () =>
  createClient({ password: process.env["REDIS_HOST_PASSWORD"] });
const client = clientConnection();

client.on("error", (err) => {
  console.log("Redis Client Error: ", err);
});

export default client;

export type RedisClient = typeof client;
