import { readFile } from "fs/promises";
import { resolve } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BlobStorageService, createMinioClient } from "./blob.storage.service";
const filePath = resolve(import.meta.dirname, "test-helpers/square.webp");
const object = await readFile(filePath);
const bucket = "temp-bucket",
  testFile = "test-file.webp",
  type = "image/webp";

describe("BlobStorageService", () => {
  let service: BlobStorageService;
  const client = createMinioClient();
  const trashBucket = async () => {
    const service = new BlobStorageService(bucket);
    if (await service.bucketExists()) {
      await service.trashBucket();
    }
  };
  beforeEach(async () => {
    await trashBucket();
    service = new BlobStorageService(bucket);
    await service.createBucket();
  });
  afterEach(async () => {
    await trashBucket();
  });

  it("Is defined", () => {
    expect(service).toBeDefined();
  });
  it("Creates bucket", async () => {
    await expect(client.bucketExists(bucket)).resolves.toBeTruthy();
  });
  it("Trying to re-create bucket does nothing (uploads preserved)", async () => {
    await service.uploadFile({ object, type, name: testFile });
    await service.createBucket();
    await expect(service.objectExists(testFile)).resolves.toBeTruthy();
  });
  it("Deletes bucket", async () => {
    await service.removeBucket();
    await expect(client.bucketExists(bucket)).resolves.toBeFalsy();
  });
  it("Uploads file (buffer)", async () => {
    await service.uploadFile({ object, type, name: testFile });
    await expect(service.objectExists(testFile)).resolves.toBeTruthy();
  });
  it("Uploads file (blob)", async () => {
    const blob = new Blob([object]);
    await service.uploadFile({ object: blob, type, name: testFile });
    await expect(service.objectExists(testFile)).resolves.toBeTruthy();
  });
  it("Uploads file (path)", async () => {
    await service.uploadFile({ object: filePath, type, name: testFile });
    await expect(service.objectExists(testFile)).resolves.toBeTruthy();
  });
  it("Removes a file", async () => {
    await service.uploadFile({ object, type, name: testFile });
    await service.removeFile(testFile);
    await expect(service.objectExists(testFile)).resolves.toBeFalsy();
  });
  it("Removes files", async () => {
    const fileNames = ["first.webp", "second.webp"];
    for (const name of fileNames) {
      await service.uploadFile({ object, type, name });
    }
    await service.removeFiles(...fileNames);
    await expect(Array.fromAsync(client.listObjectsV2(bucket))).resolves.toHaveLength(0);
  });
  it("Clears bucket", async () => {
    const fileNames = ["first.webp", "second.webp"];
    for (const name of fileNames) {
      await service.uploadFile({ object, type, name });
    }
    await expect(service.getObjectList()).resolves.toHaveLength(2);
    await service.clearBucket();
    await expect(service.getObjectList()).resolves.toHaveLength(0);
  });
  it("Attempt to clear inexistent bucket does not error", async () => {
    await service.trashBucket();
    await expect(service.clearBucket()).resolves.not.toThrow();
  });
  it("Trashes bucket", async () => {
    const fileNames = ["first.webp", "second.webp"];
    for (const name of fileNames) {
      await service.uploadFile({ object, type, name });
    }
    await service.trashBucket();
    await expect(client.bucketExists(bucket)).resolves.toBeFalsy();
  });
  it("Attempt to trash inexistent bucket does not error", async () => {
    await service.trashBucket();
    await expect(service.trashBucket()).resolves.not.toThrow();
  });
  it("objectExists provides appropriate status", async () => {
    const name = "file.webp";
    await expect(client.statObject(bucket, name)).rejects.toThrow("Not Found");
    await expect(service.objectExists(name)).resolves.toBeFalsy();
    await service.uploadFile({ object, type, name });
    await expect(client.statObject(bucket, name)).resolves.toBeTruthy();
    await expect(service.objectExists(name)).resolves.toBeTruthy();
  });
  it("Stores filepaths", async () => {
    const name = "users/user1/avatar.webp";
    await service.uploadFile({ object, type, name });
    await expect(service.objectExists(name)).resolves.toBeTruthy();
  });
});
