import { jsonReplacer, jsonReviver } from "../helpers/json-helpers.js";
import { CompleteUserDto } from "../postgres/types.js";
import client, { clientConnection, type RedisClient } from "./client.js";

export const REDIS_SESSION_KEY_PREFIX = "session";
export const REDIS_DEFAULT_SEPARATOR = ":";
export const REDIS_DEFAULT_TTL = 10 * 60;

export class RedisService {
  readonly sessionPrefix = REDIS_SESSION_KEY_PREFIX;
  readonly separator = REDIS_DEFAULT_SEPARATOR;
  #ttl = REDIS_DEFAULT_TTL;

  constructor(private client: RedisClient) {}

  set ttl(num: number) {
    this.#ttl = num;
  }
  get ttl(): number {
    return this.#ttl;
  }

  /** Create or update a session entry */
  async setSession(sessionId: string, user: CompleteUserDto): Promise<CompleteUserDto> {
    const key = this.addSessionPrefix(sessionId);
    await this.client.set(key, JSON.stringify(user, jsonReplacer));
    await this.client.expire(key, this.ttl);
    return user;
  }

  async getSession(sessionId: string): Promise<CompleteUserDto | null> {
    const user = await this.client.get(this.addSessionPrefix(sessionId));
    if (user === null) return null;
    return JSON.parse(user, jsonReviver) as CompleteUserDto;
  }

  async deleteSession(sessionId: string): Promise<number> {
    return await this.client.del(this.addSessionPrefix(sessionId));
  }

  addSessionPrefix(sessionId: string): string {
    return [this.sessionPrefix, sessionId].join(this.separator);
  }

  async connect(): Promise<void> {
    if (this.client.isOpen) return;
    await this.client.connect();
  }

  async deleteAll(): Promise<string> {
    return await this.client.flushDb();
  }
  async destroy(): Promise<void> {
    await this.client.disconnect();
  }
}

if (import.meta.vitest) {
  const { describe, it, expect, beforeAll, afterAll, afterEach } = import.meta.vitest;

  describe("RedisService", () => {
    let standaloneClient: RedisClient;
    const session1 = "session1",
      session2 = "session2";
    const user1: CompleteUserDto = {
        id: "new_user_123_id",
        username: "new_user_123",
        name: "Name",
        surname: null,
        email: "name@surname.nowhere",
        avatar: "some-avatar-data",
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "admin"
      },
      user2 = { ...user1, id: "second_new_user_id", email: "second@surname.nowhere" };
    let service: RedisService;
    beforeAll(async () => {
      standaloneClient = clientConnection();
      await standaloneClient.connect();
      service = new RedisService(client);
      await service.connect();
    });
    afterEach(async () => {
      await service.deleteAll();
      service.ttl = REDIS_DEFAULT_TTL;
    });
    afterAll(async () => {
      await service.destroy();
      await standaloneClient.disconnect();
    });
    it("Should return user object ", async () => {
      expect(await service.setSession(session1, user1)).toEqual(user1);
    });
    it("Should add session to store", async () => {
      await service.setSession(session1, user1);
      await service.setSession(session2, user2);

      const first = await standaloneClient.get(service.addSessionPrefix(session1));
      const second = await standaloneClient.get(service.addSessionPrefix(session2));
      (
        [
          [first, user1],
          [second, user2]
        ] as const
      ).forEach(([retrieved, expected]) => {
        expect(retrieved).not.toBeNull();
        expect(JSON.parse(retrieved as string, jsonReviver)).toEqual(expected);
      });
    });
    it("Should return session from store", async () => {
      await service.setSession(session1, user1);
      expect(await service.getSession(session1)).toEqual(user1);
    });
    it("Should delete session from store", async () => {
      await service.setSession(session1, user1);
      await service.deleteSession(session1);
      expect(await standaloneClient.get(service.addSessionPrefix(session1))).toBeNull();
    });
    it("Setting ttl value should work", () => {
      expect(service.ttl).toBe(REDIS_DEFAULT_TTL);
      service.ttl = 20;
      expect(service.ttl).toBe(20);
    });
    it("Should set proper ttl for session entry", async () => {
      const isInRange = (duration: number, ttl: number): boolean =>
        duration >= ttl - 1 && !(duration > ttl);
      await service.setSession(session1, user1);
      let ttl = await standaloneClient.ttl(service.addSessionPrefix(session1));
      // We allow for one second discrepancy in case of lags between setting and retrieving

      expect(isInRange(ttl, service.ttl)).toBe(true);

      service.ttl = 20;
      await service.setSession(session1, user1);
      ttl = await standaloneClient.ttl(service.addSessionPrefix(session1));
      expect(isInRange(ttl, service.ttl)).toBe(true);
    });
  });
}
