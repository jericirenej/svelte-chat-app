import { config } from "dotenv";
config();
const env = {
  POSTGRES_PASSWORD: process.env["POSTGRES_PASSWORD"],
  POSTGRES_USER: process.env["POSTGRES_USER"],
  POSTGRES_DB: process.env["POSTGRES_DB"],
  REDIS_HOST_PASSWORD: process.env["REDIS_HOST_PASSWORD"],
  POSTGRES_HOST: process.env["POSTGRES_HOST"],
  POSTGRES_PORT: Number(process.env["POSTGRES_PORT"]),
  POSTGRES_POSTGRES_DB: process.env["POSTGRES_POSTGRES_DB"],
  SESSION_TTL: Number(process.env["SESSION_TTL"]),
  MINIO_BUCKET: process.env["MINIO_BUCKET"],
  MINIO_TOKEN: process.env["MINIO_TOKEN"],
  MINIO_SECRET: process.env["MINIO_SECRET"],
  MINIO_PORT: Number(process.env["MINIO_PORT"]),
  MINIO_ENDPOINT: process.env["MINIO_ENDPOINT"]
};
type MaybeEnv = typeof env;
type Env = { [Key in keyof MaybeEnv]: Exclude<MaybeEnv[Key], undefined> };
export default env as Env;
