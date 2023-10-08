import { createClient } from "redis";
import { env } from "../helpers/get-env.js";

export const clientConnection = () => createClient({ password: env["REDIS_HOST_PASSWORD"] });
const client = clientConnection();

client.on("error", (err) => {
  console.log("Redis Client Error: ", err);
});

export default client;

export type RedisClient = typeof client;
