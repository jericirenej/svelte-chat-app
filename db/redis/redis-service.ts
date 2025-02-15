import env from "../environment.js";
import { jsonReplacer, jsonReviver } from "../helpers/json-helpers.js";
import type { CompleteUserDto } from "../postgres/types.js";
import { type RedisClient } from "./client.js";

export const REDIS_SESSION_KEY_PREFIX = "session";
export const REDIS_SESSION_SOCKET_PREFIX = "socket";
export const REDIS_USER_SESSION_BIND_PREFIX = "user";

export const REDIS_DEFAULT_SEPARATOR = ":";
export const REDIS_DEFAULT_TTL = env.SESSION_TTL || 10 * 60;

export class RedisService {
  readonly sessionPrefix = REDIS_SESSION_KEY_PREFIX;
  readonly sessionSocketPrefix = REDIS_SESSION_SOCKET_PREFIX;
  readonly userSessionBindPrefix = REDIS_USER_SESSION_BIND_PREFIX;
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
    await this.bindSessionToUser(user.id, sessionId);
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
    const user = await this.getSession(sessionId);
    if (!user) return 0;
    const result = await this.client.del(this.addSessionPrefix(sessionId));
    await this.deleteSocketSession(sessionId);
    await this.removeSessionFromBind(user.id, sessionId);
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

  async getUserSessions(userId: string): Promise<string[]> {
    const key = this.addSessionBindScan(userId);
    const keyWithoutWildcard = key.replace("*", "");
    const { keys } = await this.client.scan(0, { MATCH: key });
    return keys.map((session) => session.replace(keyWithoutWildcard, ""));
  }
  /** Entries allow us to see all active sessions for the current user. */
  protected async bindSessionToUser(userId: string, sessionId: string): Promise<string | null> {
    const key = this.addSessionBindPrefix(userId, sessionId);
    const result = await this.client.set(key, sessionId);
    await this.client.expire(key, this.ttl);
    return result;
  }

  protected async removeSessionFromBind(userId: string, sessionId: string) {
    return await this.client.del(this.addSessionBindPrefix(userId, sessionId));
  }

  addSessionBindPrefix(userId: string, sessionId: string): string {
    return [this.userSessionBindPrefix, userId, sessionId].join(this.separator);
  }
  addSessionBindScan(userId: string): string {
    return [this.userSessionBindPrefix, userId, "*"].join(this.separator);
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
