import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { clientConnection, redisClient, type RedisClient } from "./client";
import type { CompleteUserDto } from "../postgres";
import { REDIS_DEFAULT_TTL, RedisService } from "./redis-service";
import { jsonReviver } from "../helpers";

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
  service = await RedisService.init(redisClient);
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
  it("Returns user object ", async () => {
    expect(await service.setSession(session1, user1)).toEqual(user1);
  });
  it("Adds session to store", async () => {
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

  it("Returns session from store", async () => {
    await service.setSession(session1, user1);
    expect(await service.getSession(session1)).toEqual(user1);
  });
  it("Deletes session from store", async () => {
    await service.setSession(session1, user1);
    await service.deleteSession(session1);
    expect(await standaloneClient.get(service.addSessionPrefix(session1))).toBeNull();
  });
  it("Sets ttl value", () => {
    expect(service.ttl).toBe(REDIS_DEFAULT_TTL);
    service.ttl = 20;
    expect(service.ttl).toBe(20);
  });
  it("Sets proper ttl for session entry", async () => {
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
  it("Returns TTL for session", async () => {
    await service.setSession(session1, user1);
    expect(await service.getSessionTTL(session1)).toBe(service.ttl);
  });
});
describe("Binding of user sessions", () => {
  it("Adding session adds user bind entry", async () => {
    await service.setSession(session1, user1);
    await service.setSession(session2, user1);
    const bindKey = service.addSessionBindScan(user1.id);
    const { keys } = await standaloneClient.scan(0, { MATCH: bindKey });
    const expectedArr = [session1, session2].map((s) => service.addSessionBindPrefix(user1.id, s));
    expect(keys.every((key) => expectedArr.includes(key))).toBeTruthy();
  });
  it("getUserSessions retrieves all sessions for user id", async () => {
    await service.setSession(session1, user1);
    await service.setSession(session2, user1);
    const sessions = await service.getUserSessions(user1.id);
    expect(sessions.every((session) => [session1, session2].includes(session))).toBeTruthy();
  });
  it("Bound sessions have appropriate TTL", async () => {
    await service.setSession(session1, user1);
    await expect(
      standaloneClient.ttl(service.addSessionBindPrefix(user1.id, session1))
    ).resolves.toBe(service.ttl);
  });
  it("Extending a session updates session binds", async () => {
    await service.setSession(session1, user1);
    await service.replaceSessionKey(session1, session2);
    await expect(service.getUserSessions(user1.id)).resolves.toEqual([session2]);
  });
  it("Deleting a session deletes session bind", async () => {
    await service.setSession(session1, user1);
    await service.setSession(session2, user1);
    let userSessions = await service.getUserSessions(user1.id);
    expect(userSessions.every((session) => [session1, session2].includes(session))).toBeTruthy();

    await service.deleteSession(session1);
    userSessions = await service.getUserSessions(user1.id);
    expect(userSessions).toEqual([session2]);
  });
});
describe("Socket management", () => {
  it("Only sets socket session if a session already exists", async () => {
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
  it("Socket entry has same TTL as its session", async () => {
    service.ttl = 10;
    await service.setSession(session1, user1);
    service.ttl = 100;
    await service.setSession(session2, user2);
    service.ttl = 30;
    await Promise.all(
      [socket1, socket2].map(async (socket, i) => {
        await service.setSocketSession(`session${i + 1}`, socket);
      })
    );
    for (const session of [session1, session2]) {
      const socket_TTL = await standaloneClient.ttl(service.addSocketPrefix(session)),
        session_TTL = await standaloneClient.ttl(service.addSessionPrefix(session));
      expect(socket_TTL).toBe(session_TTL);
    }
  });
  it("Deletes socket session", async () => {
    await service.setSession(session1, user1);
    await service.setSocketSession(session1, socket1);
    await service.deleteSocketSession(session1);
    expect(await service.getSocketSession(session1)).toBeNull();
  });
});
describe("Session replacement", () => {
  it("Deleting session also deletes socket session", async () => {
    await service.setSession(session1, user1);
    await service.setSocketSession(session1, socket1);
    await service.deleteSession(session1);
    expect(await standaloneClient.get(service.addSocketPrefix(session1))).toBeNull();
  });
  it("Replaces session key", async () => {
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
