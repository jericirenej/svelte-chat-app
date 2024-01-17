import env from "../environment.js";
import { jsonReplacer, jsonReviver } from "../helpers/json-helpers.js";
import { CompleteUserDto } from "../postgres/types.js";
import { clientConnection, redisClient, type RedisClient } from "./client.js";

export const REDIS_SESSION_KEY_PREFIX = "session";
export const REDIS_SESSION_SOCKET_PREFIX = "socket";
export const REDIS_DEFAULT_SEPARATOR = ":";
export const REDIS_DEFAULT_TTL = env.SESSION_TTL || 10 * 60;

export class RedisService {
  readonly sessionPrefix = REDIS_SESSION_KEY_PREFIX;
  readonly sessionSocketPrefix = REDIS_SESSION_SOCKET_PREFIX;
  readonly separator = REDIS_DEFAULT_SEPARATOR;
  #ttl = REDIS_DEFAULT_TTL;
  constructor(private client:RedisClient){}

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

  /** Delete session entry. Also deletes associated socket entry
   * if it exists. */
  async deleteSession(sessionId: string): Promise<number> {
    const result = await this.client.del(this.addSessionPrefix(sessionId));
    await this.deleteSocketSession(sessionId);
    return result;
  }

  /** Replaces existing session entry with a new session key.
   * Also replaces any socket session entry if it exists. */
  async replaceSessionKey(currentId: string, newId: string): Promise<CompleteUserDto | null> {
    const sessionExists = await this.getSession(currentId);

    if (!sessionExists) return null;

    const socketId = await this.getSocketSession(currentId);

    await this.deleteSession(currentId);

    const newSession = await this.setSession(newId, sessionExists);
    if (socketId) {
      await this.setSocketSession(newId, socketId);
    }
    return newSession;
  }

  async getSessionTTL(sessionId: string): Promise<number> {
    return await this.client.ttl(this.addSessionPrefix(sessionId));
  }

  addSessionPrefix(sessionId: string): string {
    return [this.sessionPrefix, sessionId].join(this.separator);
  }

  async setSocketSession(sessionId: string, socketId: string): Promise<string | null> {
    const sessionTTL = await this.client.ttl(this.addSessionPrefix(sessionId));

    if (sessionTTL <= 0) return null;
    const key = this.addSocketPrefix(sessionId);
    const val = await this.client.set(key, socketId);
    if (val) {
      await this.client.expire(key, sessionTTL);
    }
    return val ? socketId : null;
  }

  async getSocketSession(sessionId: string): Promise<string | null> {
    return await this.client.get(this.addSocketPrefix(sessionId));
  }
  async deleteSocketSession(sessionId: string): Promise<number> {
    return await this.client.del(this.addSocketPrefix(sessionId));
  }
  addSocketPrefix(sessionId: string): string {
    return [this.sessionSocketPrefix, sessionId].join(this.separator);
  }

  async connect(): Promise<void> {
    if (this.client.isOpen) return;
    await this.client.connect();
  }

  async deleteAll(): Promise<string> {
    return await this.client.flushDb();
  }
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  /** Instantiate a RedisService with connected Redis client */
  static async init(client: RedisClient) {
    await client.connect();
    return new RedisService(client);
  }
}

const redisService = await RedisService.init(redisClient);
export { redisService };

if (import.meta.vitest) {
  const { describe, it, expect, beforeAll, afterAll, afterEach } = import.meta.vitest;
  let standaloneClient: RedisClient;
  const session1 = "session1",
    session2 = "session2",
    socket1 = "socket1",
    socket2 = "socket2";
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
    service = new RedisService(redisClient);
  });
  afterEach(async () => {
    await service.deleteAll();
    service.ttl = REDIS_DEFAULT_TTL;
  });
  afterAll(async () => {
    await service.disconnect();
    await standaloneClient.disconnect();
  });
  describe("Session management", () => {
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
    it("Should return TTL for session", async () => {
      await service.setSession(session1, user1);
      expect(await service.getSessionTTL(session1)).toBe(service.ttl);
    });
  });
  describe("Socket management", () => {
    it("Should only set socket session if a session already exists", async () => {
      for (const populateSession of [false, true]) {
        if (populateSession) {
          await service.setSession(session1, user1);
        }
        const result = await service.setSocketSession(session1, socket1);
        const socketEntry = await standaloneClient.get(service.addSocketPrefix(session1));
        const expected = populateSession ? socket1 : null;
        expect(result).toEqual(expected);
        expect(socketEntry).toEqual(expected);
        await service.deleteAll();
      }
    });
    it("Socket entry should have same TTL as its session", async () => {
      redisService.ttl = 10;
      await redisService.setSession(session1, user1);
      redisService.ttl = 100;
      await redisService.setSession(session2, user2);
      redisService.ttl = 30;
      await Promise.all(
        [socket1, socket2].map(async (socket, i) => {
          await redisService.setSocketSession(`session${i + 1}`, socket);
        })
      );
      for (const session of [session1, session2]) {
        const socket_TTL = await standaloneClient.ttl(redisService.addSocketPrefix(session)),
          session_TTL = await standaloneClient.ttl(redisService.addSessionPrefix(session));
        expect(socket_TTL).toBe(session_TTL);
      }
    });
    it("Should delete socket session", async () => {
      await redisService.setSession(session1, user1);
      await redisService.setSocketSession(session1, socket1);
      await redisService.deleteSocketSession(session1);
      expect(await redisService.getSocketSession(session1)).toBeNull();
    });
  });
  describe("Session replacement", () => {
    it("Deleting session should also delete socket session", async () => {
      await service.setSession(session1, user1);
      await service.setSocketSession(session1, socket1);
      await service.deleteSession(session1);
      expect(await standaloneClient.get(service.addSocketPrefix(session1))).toBeNull();
    });
    it("Should replace session key", async () => {
      const session_new_1 = "session_new_1",
        session_new_2 = "session_new_2";
      await service.setSession(session1, user1);
      await service.setSocketSession(session1, socket1);
      await service.setSession(session2, user2);

      await service.replaceSessionKey(session1, session_new_1);
      expect(await service.getSession(session_new_1)).toEqual(user1);
      expect(await service.getSocketSession(session_new_1)).toBe(socket1);

      await service.replaceSessionKey(session2, session_new_2);
      expect(await service.getSession(session_new_2)).toEqual(user2);
      // Double check that we are not creating any socket entries, if there are none initially
      expect(await service.getSocketSession(session_new_2)).toBeNull();
    });
  });
}
