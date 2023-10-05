import { CompleteUserDto } from "../postgres/types.js";
import client, { clientConnection, type RedisClient } from "./client.js";
import { jsonReplacer, jsonReviver } from "./utils.js";

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

  async addSession(sessionId: string, user: CompleteUserDto): Promise<CompleteUserDto> {
    const key = this.#generateSessionKey(sessionId);
    const put = JSON.stringify(user, jsonReplacer);
    console.log("WILL SAVE", put);
    await this.client.set(key, JSON.stringify(user, jsonReplacer));
    await this.client.expire(key, this.ttl);
    return user;
  }

  async getSession(sessionId: string): Promise<CompleteUserDto | null> {
    const user = await this.client.get(this.#generateSessionKey(sessionId));
    if (user === null) return null;
    return JSON.parse(user, jsonReviver) as CompleteUserDto;
  }

  async deleteSession(sessionId: string): Promise<number> {
    return await this.client.del(this.#generateSessionKey(sessionId));
  }

  #generateSessionKey(sessionId: string): string {
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
    const session1 = "session1";
    const user: CompleteUserDto = {
      id: "new_user_123_id",
      username: "new_user_123",
      name: "Name",
      surname: null,
      email: "name@surname.nowhere",
      avatar: "some-avatar-data",
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "admin"
    };
    let service: RedisService;
    beforeAll(async () => {
      standaloneClient = clientConnection();
      await standaloneClient.connect();
      service = new RedisService(client);
      await service.connect();
    });
    afterEach(async () => {
      await service.deleteAll();
    });
    afterAll(async () => {
      await service.destroy();
      await standaloneClient.disconnect();
    });
    it("Should return user object ", async () => {
      expect(await service.addSession(session1, user)).toEqual(user);
    });
    it("Should add session to store", async () => {
      await service.addSession(session1, user);

      const exists = await standaloneClient.get(
        [REDIS_SESSION_KEY_PREFIX, session1].join(REDIS_DEFAULT_SEPARATOR)
      );
      expect(exists).not.toBeNull();
      if (exists) {
        expect(JSON.parse(exists, jsonReviver)).toEqual(user);
        /* expect(JSON.parse(exists)).toEqual(user); */
      }
    });
  });
}
