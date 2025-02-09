import { type BucketItem, Client as MinioClient, S3Error } from "minio";
import env from "../environment";

import { readFile } from "fs/promises";
import type { Readable } from "stream";
export const createMinioClient = () => {
  return new MinioClient({
    endPoint: env.MINIO_ENDPOINT,
    accessKey: env.MINIO_TOKEN,
    port: env.MINIO_PORT,
    secretKey: env.MINIO_SECRET,
    useSSL: env.MINIO_ENDPOINT !== "localhost"
  });
};

type FilePath = string;

export class BlobStorageService {
  static sanitizeBucketName(name: string) {
    return name.replaceAll("_", "-");
  }
  protected client: MinioClient;
  public readonly bucketName: string;
  constructor(bucketName: string = env.MINIO_BUCKET) {
    this.client = createMinioClient();
    this.bucketName = BlobStorageService.sanitizeBucketName(bucketName);
  }

  async bucketExists(): Promise<boolean> {
    return this.client.bucketExists(this.bucketName);
  }

  async objectExists(name: string): Promise<boolean> {
    try {
      const result = await this.client.statObject(this.bucketName, name);
      return !!result;
    } catch (err: unknown) {
      if (err instanceof S3Error && err.code === "NotFound") {
        return false;
      }
      throw err;
    }
  }

  async createBucket(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucketName);
    if (exists) return;
    await this.client.makeBucket(this.bucketName);
  }

  async uploadFile({
    object,
    type,
    name
  }: {
    object: Buffer | Blob | FilePath;
    type: string;
    name: string;
  }) {
    const buffer = await this.toBuffer(object);
    return await this.client.putObject(this.bucketName, name, buffer, buffer.length, { type });
  }

  async getFile(objectName: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucketName, objectName);
    return this.streamToBuffer(stream);
  }

  async removeFile(objectName: string): Promise<void> {
    await this.client.removeObject(this.bucketName, objectName);
  }

  async removeFiles(...objectNames: string[]): Promise<void> {
    await Promise.all(
      objectNames.map(async (name) => {
        await this.removeFile(name);
      })
    );
  }

  async clearBucket(): Promise<void> {
    if (!(await this.bucketExists())) return;
    const objectNames = (await this.getObjectList(undefined, true))
      .map((val) => val.name)
      .filter((val): val is string => val !== undefined);
    await this.client.removeObjects(this.bucketName, objectNames);
  }

  /** Remove bucket, but it has to be empty first */
  async removeBucket(): Promise<void> {
    if (!(await this.bucketExists())) return;
    await this.client.removeBucket(this.bucketName);
  }

  /** Remove bucket, together with its contents */
  async trashBucket(): Promise<void> {
    await this.clearBucket();
    await this.removeBucket();
  }

  protected async toBuffer(val: Buffer | Blob | FilePath): Promise<Buffer> {
    if (val instanceof Buffer) return val;
    if (val instanceof Blob) return Buffer.from(await val.arrayBuffer());
    return await readFile(val);
  }
  protected async streamToBuffer(stream: Readable): Promise<Buffer> {
    return Buffer.concat(await this.streamToArray(stream));
  }

  protected async streamToArray<T>(stream: Readable) {
    return await Array.fromAsync<T>(stream);
  }

  async getObjectList(prefix?: string, recursive?: boolean, startAfter?: string) {
    return await this.streamToArray<BucketItem>(
      this.client.listObjectsV2(this.bucketName, prefix, recursive, startAfter)
    );
  }
}
