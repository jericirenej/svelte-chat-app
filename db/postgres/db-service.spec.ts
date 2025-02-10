import { randomUUID } from "crypto";

import { faker } from "@faker-js/faker";
import { add } from "date-fns";
import type { Kysely } from "kysely";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseService } from "./db-service.js";
import type { DB } from "./db-types.js";
import { TestingDatabases } from "./tools/testing.database.service.js";
import { randomPick, uniqueUUID } from "./tools/utils.js";
import type {
  ChatUserDto,
  CompleteUserDto,
  CreateMessageDto,
  GetChatDto,
  MessageDto,
  ParticipantDto
} from "./types.js";
import type {
  AuthDto,
  CreateChatDto,
  CreateUserDto,
  SingleUserSearch,
  UpdateAuthDto,
  UpdateUserDto
} from "./types.js";

const keyGuard = <T extends Record<string, unknown>>(key: unknown, obj: T): key is keyof T =>
  typeof key === "string" && key in obj;

const testingDatabases = new TestingDatabases();
let service: DatabaseService;
let db: Kysely<DB>;

describe("DatabaseService", () => {
  const firstUser = {
    username: "new_user_123",
    name: "Name",
    surname: "Surname",
    email: "name@surname.nowhere",
    avatar: "some-avatar-data",
    hash: "password-hash",
    salt: "password-salt"
  } satisfies CreateUserDto;
  const secondUser = {
    ...firstUser,
    email: "other.user@nowhere",
    username: "other_user_123",
    hash: "other-password-hash",
    salt: "other-password-salt"
  };
  const thirdUser = {
    ...firstUser,
    email: "third.user@nowhere.com",
    username: "third_user_456",
    hash: "third-password-hash",
    salt: "third-password-salt"
  };
  const superAdmin = {
    ...firstUser,
    username: "superadmin",
    email: "superadmin@nowhere.never"
  };
  beforeAll(async () => {
    db = await testingDatabases.createTestDB("test_db");
    service = new DatabaseService(db);
  });
  afterAll(async () => {
    await testingDatabases.cleanup();
  });
  describe("Users", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });
    const userProps = [
      "id",
      "email",
      "name",
      "surname",
      "username",
      "avatar",
      "createdAt",
      "updatedAt",
      "role"
    ] satisfies (keyof CompleteUserDto)[];
    const authProps = ["id", "hash", "salt", "createdAt", "updatedAt"] satisfies (keyof AuthDto)[];
    describe("User CRUD", () => {
      afterEach(async () => {
        await db.deleteFrom("user").execute();
      });
      it("addUser creates and returns user entry", async () => {
        const user = await service.addUser(firstUser);
        expect(user).not.toBeUndefined();

        userProps.forEach((key) => {
          expect(user).toHaveProperty(key);

          if (keyGuard(key, firstUser)) {
            expect(user[key]).toEqual(firstUser[key]);
          }
        });
      });
      it("Creates user with minimal required properties", async () => {
        const { email, username, hash, salt } = firstUser;
        const minimal: CreateUserDto = { email, username, hash, salt };
        const user = await service.addUser(minimal);
        expect(user).not.toBeNull();
        userProps.forEach((key) => {
          expect(user).toHaveProperty(key);
        });
      });
      it("First created user is super admin", async () => {
        const { id } = await service.addUser(firstUser);
        expect(
          await db
            .selectFrom("admin")
            .select("id")
            .where((eb) => eb.and([eb("id", "=", id), eb("superAdmin", "=", true)]))
            .executeTakeFirst()
        ).toEqual({ id });
      });
      it("Non-first user created as normal user", async () => {
        await service.addUser(firstUser);
        const { id } = await service.addUser(secondUser);
        const admins = await db.selectFrom("admin").select("id").execute();
        const adminIds = admins.map(({ id }) => id);
        expect(admins).toHaveLength(1);
        expect(adminIds[0]).not.toBe(id);
      });
      it("addUser throws if required fields are missing", async () => {
        const necessary = ["username", "email"] satisfies (keyof CreateUserDto)[];
        for (const required of necessary) {
          const cloneUser = JSON.parse(JSON.stringify(firstUser)) as Record<string, unknown>;
          delete cloneUser[required];
          await expect(() => service.addUser(cloneUser as CreateUserDto)).rejects.toThrow();
        }
      });
      it("addUser creates auth entry", async () => {
        const { id } = await service.addUser(firstUser);
        const authEntry = await db
          .selectFrom("auth")
          .selectAll()
          .where("id", "=", id)
          .executeTakeFirstOrThrow();

        authProps.forEach((key) => {
          expect(authEntry).toHaveProperty(key);
          if (keyGuard(key, firstUser)) {
            expect(authEntry[key]).toEqual(firstUser[key]);
          }
        });
      });
      it("updateUser updates user and modifies updatedAt", async () => {
        const date = new Date(3000, 0, 1, 12);
        vi.setSystemTime(date);
        const { id } = await service.addUser(firstUser);
        const update: UpdateUserDto = { username: "other-user" };
        const updated = await service.updateUser(id, update);
        expect(updated.username).toBe("other-user");
        expect(updated.updatedAt.getTime()).toBe(date.getTime());
      });
      it("updateUser throws if updating inexistent user", async () => {
        await service.addUser(firstUser);
        await expect(
          service.updateUser(randomUUID(), { username: "other-user" })
        ).rejects.toThrowError();
      });
      it("usernameExists evaluates provided username", async () => {
        await service.addUser(firstUser);
        await expect(service.usernameExists(firstUser.username)).resolves.toBe(true);
        await expect(service.usernameExists("inexistent")).resolves.toBe(false);
      });
      it("emailExists evaluates provided email", async () => {
        await service.addUser(firstUser);
        await expect(service.emailExists(firstUser.email)).resolves.toBe(true);
        await expect(service.emailExists("inexistent@nowhere.never")).resolves.toBe(false);
      });
      it("removeUser allows users to delete own account", async () => {
        await service.addUser(firstUser);
        const { id } = await service.addUser(secondUser);
        await service.removeUser(id, id);
        expect(await db.selectFrom("user").where("id", "=", id).execute()).toEqual([]);
      });
      it("User deletions cascade", async () => {
        await service.addUser(superAdmin);
        const { id } = await service.addUser(firstUser);
        await service.removeUser(id, id);
        const authEmpty = await db
          .selectFrom("auth")
          .select("id")
          .where("id", "=", id)
          .executeTakeFirst();
        const userEmpty = await db
          .selectFrom("user")
          .select("id")
          .where("id", "=", id)
          .executeTakeFirst();
        expect([authEmpty, userEmpty].every((v) => v === undefined)).toBe(true);
      });
      it("Throws if users try to delete other users", async () => {
        await service.createSuperAdmin(superAdmin);
        const [first, second] = await Promise.all(
          [firstUser, secondUser].map((u) => service.addUser(u))
        );
        await expect(service.removeUser(first.id, second.id)).rejects.toThrowError();
      });
      it("getCredentials returns credentials", async () => {
        const { username, id } = await service.addUser(firstUser);
        const targetCredentials = await db
          .selectFrom("auth")
          .selectAll()
          .where("id", "=", id)
          .executeTakeFirstOrThrow();
        expect(await service.getCredentials(username)).toEqual(targetCredentials);
        expect(await service.getCredentials("inexistent")).toBeUndefined();
      });
      it("updateCredentials updates hash and salt", async () => {
        const { id } = await service.addUser(firstUser);
        const date = new Date(3000, 0, 1, 12);
        vi.setSystemTime(date);
        const updateAuth: UpdateAuthDto = { hash: "new-hash", salt: "new-salt" };
        const updated = await service.updateCredentials(id, updateAuth);
        expect(updated).toBe(true);
        const { updatedAt, hash, salt } = await db
          .selectFrom("auth")
          .selectAll()
          .where("id", "=", id)
          .executeTakeFirstOrThrow();
        expect({ hash, salt }).toEqual(updateAuth);
        expect(updatedAt.getTime()).toBe(date.getTime());
      });
    });
    describe("Admin CRUD", () => {
      afterEach(async () => {
        await db.deleteFrom("user").execute();
      });
      it("Creates super admin", async () => {
        const user = await service.createSuperAdmin(firstUser);
        userProps.forEach((key) => {
          expect(user).toHaveProperty(key);
          if (keyGuard(key, firstUser)) {
            expect(user[key]).toBe(firstUser[key]);
          }
        });
        const adminEntry = await db
          .selectFrom("admin")
          .select("id")
          .where("id", "=", user.id)
          .execute();
        expect(adminEntry.length).toBe(1);
      });
      it("Rejects super admin creation if one already exists", async () => {
        await service.addUser(firstUser);
        await expect(service.createSuperAdmin(secondUser)).rejects.toThrowError();
      });
      it("addAdmin proceeds if grantor is super admin and grantee exists", async () => {
        const admin = await service.createSuperAdmin(firstUser);
        const adminToBe = await service.addUser(secondUser);
        await service.addAdmin(admin.id, adminToBe.id);
        const isAdminToBeConfirmed = await db
          .selectFrom("admin")
          .select("id")
          .where("id", "=", adminToBe.id)
          .executeTakeFirst();
        expect(isAdminToBeConfirmed).not.toBeUndefined();
      });
      it("addAdmin rejects if super admin does not exist", async () => {
        const adminToBe = await service.addUser(secondUser);
        await expect(service.addAdmin(randomUUID(), adminToBe.id)).rejects.toThrowError();
      });
      it("addAdmin rejects if grantor is not superAdmin", async () => {
        const superAdminUser = await service.addUser(superAdmin);
        const nonAdmin = await service.addUser(firstUser);
        const ordinaryAdmin = await service.addUser(thirdUser);
        await service.addAdmin(superAdminUser.id, ordinaryAdmin.id);

        const adminToBe = await service.addUser(secondUser);
        await expect(service.addAdmin(nonAdmin.id, adminToBe.id)).rejects.toThrowError();
        await expect(service.addAdmin(ordinaryAdmin.id, adminToBe.id)).rejects.toThrowError();
      });
      it("addAdmin rejects if grantee does not exist", async () => {
        const admin = await service.createSuperAdmin(firstUser);
        await expect(service.addAdmin(admin.id, randomUUID())).rejects.toThrowError();
      });
      it("transferSuperAdmin transfers role", async () => {
        const { id: superAdminId } = await service.addUser(superAdmin);
        const { id } = await service.addUser(firstUser);
        await service.transferSuperAdmin(superAdminId, id);
        const superAdmins = await db
          .selectFrom("admin")
          .select("id")
          .where("superAdmin", "=", true)
          .execute();
        expect(superAdmins.length).toBe(1);
        expect(superAdmins[0].id).toBe(id);
      });
      it("removeUser disallows super admins to delete own account", async () => {
        const { id } = await service.addUser(firstUser);
        await expect(service.removeUser(id, id)).rejects.toThrowError();
      });
      it("removeUser allows admins to remove normal users", async () => {
        const { id: superAdminId } = await service.addUser(superAdmin);
        const { id: adminId } = await service.addUser(firstUser);
        const { id } = await service.addUser(secondUser);
        await service.addAdmin(superAdminId, adminId);
        await service.removeUser(adminId, id);
        expect(await db.selectFrom("user").select("id").where("id", "=", id).execute()).toEqual([]);
      });
      it("removeUser allows super admins to remove admin users", async () => {
        const admin = await service.createSuperAdmin(firstUser);
        const secondAdmin = await service.addUser(secondUser);
        await service.addAdmin(admin.id, secondAdmin.id);
        await service.removeAdmin(admin.id, secondAdmin.id);
        expect(
          await db
            .selectFrom("admin")
            .select("id")
            .where("id", "=", secondAdmin.id)
            .executeTakeFirst()
        ).toBeUndefined();
      });
      it("removeUser disallows admin removal if acting user is not super admin", async () => {
        const superAdmin = await service.addUser(firstUser);
        const nonPrivilegedUser = await service.addUser(secondUser);
        await expect(
          service.removeAdmin(nonPrivilegedUser.id, superAdmin.id)
        ).rejects.toThrowError();

        const nonSuperAdmin = await service.addUser({
          ...secondUser,
          username: "third-user",
          email: "third@nowhere.never"
        });
        await service.addAdmin(superAdmin.id, nonSuperAdmin.id);
        await expect(service.removeAdmin(nonSuperAdmin.id, superAdmin.id)).rejects.toThrowError();
      });
      it("removeAdmin disallows super admins to remove themselves", async () => {
        const { id } = await service.addUser(firstUser);
        await expect(service.removeAdmin(id, id)).rejects.toThrowError();
      });
      it("removeAdmin rejects if acting user does not exist", async () => {
        const admin = await service.createSuperAdmin(firstUser);
        await expect(service.removeAdmin("inexistent", admin.id)).rejects.toThrowError();
      });
      it("removeAmin rejects if target user is not admin", async () => {
        const admin = await service.createSuperAdmin(firstUser);
        const nonPrivilegedUser = await service.addUser(secondUser);
        await expect(service.removeAdmin(admin.id, nonPrivilegedUser.id)).rejects.toThrowError();
      });
    });
    describe("User search", () => {
      const firstToCreate: CreateUserDto = {
          ...firstUser,
          name: "John",
          surname: "Doe",
          username: "john_doe_123",
          email: "john.doe@nowhere.com"
        },
        secondToCreate: CreateUserDto = {
          ...firstUser,
          name: "Jane",
          surname: "Doe",
          username: "jane_doe_456",
          email: "jane.doe@nowhere.com"
        },
        thirdToCreate: CreateUserDto = {
          ...firstUser,
          name: undefined,
          surname: undefined,
          username: "mystery_person_123",
          email: "mystery.person@nowhere.com"
        };
      let firstCreated: CompleteUserDto,
        secondCreated: CompleteUserDto,
        thirdCreated: CompleteUserDto;
      beforeEach(async () => {
        firstCreated = await service.addUser(firstToCreate);
        secondCreated = await service.addUser(secondToCreate);
        thirdCreated = await service.addUser(thirdToCreate);
      });
      afterEach(async () => {
        await db.deleteFrom("user").execute();
      });
      it("getUser includes role specification", async () => {
        const superAdmin = await service.getUser({ property: "id", value: firstCreated.id });
        expect(superAdmin?.role).toBe("superAdmin");
        await service.addAdmin(firstCreated.id, secondCreated.id);
        const admin = await service.getUser({ property: "id", value: secondCreated.id });
        expect(admin?.role).toBe("admin");
        await service.removeAdmin(firstCreated.id, secondCreated.id);
        const nonAdmin = await service.getUser({ property: "id", value: secondCreated.id });
        expect(nonAdmin?.role).toBe("user");
        await service.transferSuperAdmin(firstCreated.id, secondCreated.id);
        const newSuper = await service.getUser({ property: "id", value: secondCreated.id });
        expect(newSuper?.role).toBe("superAdmin");
      });
      it("getUser retrieves user by unique column value", async () => {
        await db.deleteFrom("user").where("id", "=", thirdCreated.id).execute();
        const testCases: { search: SingleUserSearch; expected: CompleteUserDto | undefined }[] = [
          {
            search: { property: "id", value: firstCreated.id },
            expected: { ...firstCreated, role: "superAdmin" }
          },
          { search: { property: "id", value: thirdCreated.id }, expected: undefined },
          {
            search: { property: "username", value: secondCreated.username },
            expected: { ...secondCreated, role: "user" }
          },
          { search: { property: "username", value: "inexistent" }, expected: undefined },
          {
            search: { property: "email", value: secondCreated.email },
            expected: { ...secondCreated, role: "user" }
          },
          { search: { property: "email", value: "inexistent" }, expected: undefined }
        ];

        for (const { search, expected } of testCases) {
          expect(await service.getUser(search)).toEqual(expected);
        }
      });
      it("searchForUsers performs case insensitive search for users", async () => {
        const testCases: { search: string; expected: number }[] = [
          { search: "123", expected: 2 },
          { search: "doe", expected: 2 },
          { search: "jAnE", expected: 1 },
          { search: "person", expected: 1 }
        ];
        for (const { search, expected } of testCases) {
          const searchResult = await service.searchForUsers(search);
          expect(searchResult).toHaveLength(expected);
        }
      });
      it("searchForUsers filters out users that match excludedIds", async () => {
        const searchResult = await service.searchForUsers("doe", [firstCreated.id]);
        expect(searchResult).toHaveLength(1);
        expect(searchResult[0].id).toBe(secondCreated.id);
      });
    });
  });

  describe("Chats constellation CRUD", () => {
    let firstCreated: CompleteUserDto,
      secondCreated: CompleteUserDto,
      thirdCreated: CompleteUserDto,
      participants: string[],
      allUserIds: string[],
      chatParticipantArr: ChatUserDto[];

    const messageProps = [
      "message",
      "id",
      "createdAt",
      "updatedAt",
      "chatId",
      "deleted",
      "userId"
    ] satisfies (keyof MessageDto)[];
    const chatName = "chatName";
    const genMessage = () => faker.lorem.words({ min: 1, max: 10 });
    const insertMsgs = async (
      chatId: string,
      userPool: string[],
      num: number
    ): Promise<MessageDto[]> =>
      await Promise.all(
        new Array(num)
          .fill(0)
          .map(() =>
            service.createMessage({ chatId, userId: randomPick(userPool), message: genMessage() })
          )
      );

    beforeAll(async () => {
      firstCreated = await service.addUser(firstUser);
      secondCreated = await service.addUser(secondUser);
      thirdCreated = await service.addUser(thirdUser);
      chatParticipantArr = [firstCreated, secondCreated, thirdCreated].map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        surname: u.surname,
        avatar: u.avatar
      }));
      participants = [firstCreated.id, secondCreated.id];
      allUserIds = [firstCreated.id, secondCreated.id, thirdCreated.id];
    });
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(async () => {
      vi.useRealTimers();
      await db.deleteFrom("chat").execute();
    });
    afterAll(async () => {
      await db.deleteFrom("user").execute();
    });
    it("crateChat creates chat and participant entries", async () => {
      const createChat: CreateChatDto = { name: chatName, participants };
      const { id, participants: returnedParticipants } = await service.createChat(createChat);
      expect(returnedParticipants).toEqual(chatParticipantArr.slice(0, 2));

      const chatQuery = await db
        .selectFrom("chat")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();

      expect(chatQuery).not.toBeUndefined();
      expect(chatQuery?.name).toBe(chatName);

      const participantsQuery = await db
        .selectFrom("participant")
        .select("id")
        .where("userId", "in", participants)
        .execute();
      expect(participantsQuery.length).toBe(participants.length);
    });
    it("createChat rejects if some participants do not exist", async () => {
      const inexistent = uniqueUUID(allUserIds);
      await expect(
        service.createChat({ participants: [...participants, inexistent] })
      ).rejects.toThrowError();
    });
    it("createChat rejects if less than two participants provided", async () => {
      await expect(
        service.createChat({ name: chatName, participants: participants.slice(0, 1) })
      ).rejects.toThrowError();
    });
    it("addParticipantToChat adds participants to existing chats", async () => {
      const { id } = await service.createChat({ name: chatName, participants });
      const participant = await service.addParticipantToChat(id, thirdCreated.id);
      const participantProps = [
        "chatId",
        "createdAt",
        "id",
        "updatedAt",
        "userId",
        "chatLastAccess"
      ] satisfies (keyof ParticipantDto)[];
      expect(participant).not.toBeUndefined();
      participantProps.forEach((key) => {
        expect(participant).toHaveProperty(key);
      });
    });
    it("addParticipantToChat rejects if chat or user does not exist or user is already added", async () => {
      const { id } = await service.createChat({ name: chatName, participants });
      const nonExistingParticipant = uniqueUUID(participants);
      const nonExistingChat = uniqueUUID([id]);

      const testCases: { chatId: string; userId: string }[] = [
        { chatId: id, userId: nonExistingParticipant },
        { chatId: nonExistingChat, userId: thirdCreated.id },
        { chatId: id, userId: participants[0] }
      ];

      for (const { chatId, userId } of testCases) {
        await expect(service.addParticipantToChat(chatId, userId)).rejects.toThrowError();
      }
    });
    it("setParticipantChatAccess updates chatLastAccessed", async () => {
      const { id } = await service.createChat({ name: chatName, participants });
      const getParticipant = async () =>
        db
          .selectFrom("participant")
          .selectAll()
          .where((eb) => eb.and([eb("chatId", "=", id), eb("userId", "=", participants[0])]))
          .executeTakeFirstOrThrow();
      const initial = await getParticipant();
      expect(initial.chatLastAccess).toBeNull();
      const date = new Date("2025-01-01T12:00:00");
      vi.setSystemTime(date);
      await service.setParticipantChatAccess(id, participants[0]);
      const updated = await getParticipant();
      expect(updated.chatLastAccess).toEqual(date);
      expect(updated.updatedAt).toEqual(date);
    });
    it("getChat retrieves chat data", async () => {
      const allParticipants = [...participants, thirdCreated.id];
      const { id } = await service.createChat({ name: chatName, participants: allParticipants });
      const returnedChat = await service.getChat(id);
      expect(returnedChat).not.toBeUndefined();
      expect(returnedChat?.name).toBe(chatName);
      expect(returnedChat?.participants).toEqual(chatParticipantArr);
    });
    it("getChat returns undefined for inexisting chats", async () => {
      const { id } = await service.createChat({ name: chatName, participants });
      await db.deleteFrom("chat").execute();
      expect(await service.getChat(id)).toBeUndefined();
    });
    it("getChatIdsForUsers retrieves chat ids for specified user", async () => {
      const otherChat = "otherChat";
      const { id: firstChatId } = await service.createChat({ name: chatName, participants });
      const { id: secondChatId } = await service.createChat({
        name: otherChat,
        participants: [...participants, thirdCreated.id]
      });

      expect(await service.getChatIdsForUser(participants[0])).toEqual([firstChatId, secondChatId]);
      expect(await service.getChatIdsForUser(thirdCreated.id)).toEqual([secondChatId]);
    });
    it("getParticipantsForChat retrieves chat participants", async () => {
      const { id } = await service.createChat({
        name: "chatName",
        participants
      });
      const result = await service.getParticipantsForChat(id);
      expect(result).toHaveLength(participants.length);
      expect(result.map(({ id }) => id)).toEqual(participants);
    });
    it("getParticipantsForChat throws for inexistent chats", async () => {
      await expect(() =>
        service.getParticipantsForChat(uniqueUUID(["invalid"]))
      ).rejects.toThrowError();
    });
    it("getChats retrieves chats based on provided ids", async () => {
      const otherChat = "otherChat";
      const { id: firstChatId } = await service.createChat({ name: chatName, participants });
      const { id: secondChatId } = await service.createChat({
        name: otherChat,
        participants: [...participants, thirdCreated.id]
      });
      const chatDtoProps = [
        "createdAt",
        "id",
        "updatedAt",
        "name",
        "participants",
        "messages",
        "totalMessages"
      ] satisfies (keyof GetChatDto)[];
      const results = await service.getChats({ chatIds: [firstChatId, secondChatId] });
      expect(results.length).toBe(2);
      results.forEach((result) => {
        chatDtoProps.forEach((key) => {
          expect(result).toHaveProperty(key);
        });
      });
    });
    it("getChats orders by participants", async () => {
      const { id: firstChatId } = await service.createChat({ participants });
      const { id: secondChatId } = await service.createChat({
        participants: [...participants, thirdCreated.id]
      });
      const chatIds = [firstChatId, secondChatId];
      for (const [direction, expected] of [
        ["asc", chatIds],
        ["desc", [...chatIds].reverse()]
      ] as const) {
        const result = await service.getChats({ chatIds, property: "participants", direction });
        expect(result.map(({ id }) => id)).toEqual(expected);
      }
    });
    it("getChats orders by message count", async () => {
      const { id: firstChatId } = await service.createChat({ participants });
      const { id: secondChatId } = await service.createChat({ participants });
      const { id: thirdChatId } = await service.createChat({ participants });
      await insertMsgs(firstChatId, participants, 3);
      await insertMsgs(secondChatId, participants, 5);

      const ascIds = [thirdChatId, firstChatId, secondChatId];
      for (const [direction, expected] of [
        ["asc", ascIds],
        ["desc", [...ascIds].reverse()]
      ] as const) {
        const result = await service.getChats({ chatIds: ascIds, direction, property: "message" });
        expect(result.map(({ id }) => id)).toEqual(expected);
      }
    });
    it("getChats orders by created date", async () => {
      const { id: firstChatId } = await service.createChat({ participants });
      const { id: secondChatId, createdAt } = await service.createChat({ participants });
      // Set second chat to have been created before first
      const beforeDate = new Date(createdAt.getTime() - 10e8);
      await db
        .updateTable("chat")
        .set({ createdAt: beforeDate, updatedAt: beforeDate })
        .where("id", "=", secondChatId)
        .execute();

      const chatIds = [firstChatId, secondChatId];
      for (const [direction, expected] of [
        ["asc", [...chatIds].reverse()],
        ["desc", chatIds]
      ] as const) {
        const result = await service.getChats({ chatIds, property: "createdAt", direction });
        expect(result.map(({ id }) => id)).toEqual(expected);
      }
    });
    it("getChats sorts by names with null values last", async () => {
      const { id: zNameId } = await service.createChat({ name: "ZZZ", participants });
      const { id: nullNameId } = await service.createChat({ participants });
      const { id: aNameId } = await service.createChat({ name: "AAA", participants });
      const ascendingIds = [aNameId, zNameId, nullNameId];
      const descendingIds = [zNameId, aNameId, nullNameId];
      for (const [direction, expected] of [
        ["asc", ascendingIds],
        ["desc", descendingIds]
      ] as const) {
        const result = await service.getChats({
          chatIds: ascendingIds,
          property: "name",
          direction
        });
        expect(result.map(({ id }) => id)).toEqual(expected);
      }
    });
    it("getChatsForUser retrieves all chats for user", async () => {
      const { id: firstUserChat1 } = await service.createChat({
        participants: [firstCreated.id, secondCreated.id]
      });
      const { id: firstUserChat2 } = await service.createChat({
        participants: [firstCreated.id, thirdCreated.id]
      });
      await service.createChat({
        participants: [secondCreated.id, thirdCreated.id]
      });

      const firstUserChats = [firstUserChat1, firstUserChat2];
      const results = await service.getChatsForUser(firstCreated.id);
      expect(results.length).toBe(2);
      const chatIds = results.map(({ id }) => id);
      expect(chatIds.every((id) => firstUserChats.includes(id))).toBe(true);
    });
    it("getChatsForUser respects order by property", async () => {
      const { id } = await service.createChat({
        participants: [firstCreated.id, secondCreated.id]
      });
      const spyOnGetChats = vi.spyOn(service, "getChats");
      const orderObj = { direction: "desc", property: "name" } as const;
      await service.getChatsForUser(firstCreated.id, orderObj);
      expect(spyOnGetChats).toHaveBeenLastCalledWith({ chatIds: [id], ...orderObj });
      spyOnGetChats.mockRestore();
    });
    it("chatExists indicates whether chat exists", async () => {
      const { id } = await service.createChat({ participants });
      await expect(service.chatExists(id)).resolves.toBeTruthy();
      await expect(service.chatExists(uniqueUUID(["inexistent"]))).resolves.toBeFalsy();
    });
    it("deleteChats allows admins to directly delete a single chat", async () => {
      const { id: firstChatId } = await service.createChat({ participants });
      const { id: secondChatId } = await service.createChat({ participants });
      await insertMsgs(firstChatId, participants, 3);
      await insertMsgs(secondChatId, participants, 3);

      const adminId = (await db.selectFrom("admin").select("id").executeTakeFirstOrThrow()).id;
      await service.deleteChats(adminId, firstChatId);
      const deletedChat = await db
        .selectFrom("chat")
        .selectAll()
        .where("id", "=", firstChatId)
        .execute();
      const deletedParticipants = await db
        .selectFrom("participant")
        .selectAll()
        .where("chatId", "=", firstChatId)
        .execute();
      const deletedMessages = await db
        .selectFrom("message")
        .selectAll()
        .where("chatId", "=", firstChatId)
        .execute();
      expect([deletedChat, deletedParticipants, deletedMessages].flat().length).toBe(0);

      const otherChat = await db
        .selectFrom("chat")
        .selectAll()
        .where("id", "=", secondChatId)
        .execute();
      expect(otherChat.length).toBe(1);
    });
    it("deleteChats allows admins to delete multiple chats", async () => {
      const { id: firstChatId } = await service.createChat({ participants });
      const { id: secondChatId } = await service.createChat({ participants });
      const adminId = (await db.selectFrom("admin").select("id").executeTakeFirstOrThrow()).id;
      await service.deleteChats(adminId, [firstChatId, secondChatId]);
      const deletedChats = await db
        .selectFrom("chat")
        .selectAll()
        .where("id", "in", [firstChatId, secondChatId])
        .execute();
      expect(deletedChats.length).toBe(0);
    });
    it("deleteChats rejects for non-admin users or non existent chats", async () => {
      const { id: firstChatId } = await service.createChat({ participants });
      const adminId = (await db.selectFrom("admin").select("id").executeTakeFirstOrThrow()).id;
      const nonAdminId = (
        await db
          .selectFrom("user as u")
          .leftJoin("admin as a", "a.id", "u.id")
          .select("u.id")
          .where("a.id", "is", null)
          .executeTakeFirstOrThrow()
      ).id;
      const nonExistent = uniqueUUID([firstChatId]);
      await expect(service.deleteChats(nonAdminId, firstChatId)).rejects.toThrowError();
      await expect(service.deleteChats(adminId, nonExistent)).rejects.toThrowError();
      await expect(service.deleteChats(adminId, [firstChatId, nonExistent])).rejects.toThrowError();
      expect(await service.getChat(firstChatId)).not.toBeUndefined();
    });
    it("removeParticipantFromChat removes participant from chat", async () => {
      const { id } = await service.createChat({ name: chatName, participants: allUserIds });
      const { id: secondId } = await service.createChat({ participants });
      expect(await service.removeParticipantFromChat(id, allUserIds[0])).toBe(true);

      const removedParticipant = await db
        .selectFrom("participant")
        .selectAll()
        .where("userId", "=", allUserIds[0])
        .execute();

      expect(removedParticipant).toHaveLength(1);
      expect(removedParticipant[0].chatId).toBe(secondId);

      const remainingChats = await db.selectFrom("chat").selectAll().execute();
      expect(remainingChats).toHaveLength(2);
    });
    it("removeParticipantFromChat removes chat if request comes from chat with only 2 participants", async () => {
      const participants = allUserIds;
      const { id } = await service.createChat({ name: chatName, participants });
      for (const [participant, index] of participants.map((p, i) => [p, i] as const)) {
        const lastTwo = index === participants.length - 2;
        await service.removeParticipantFromChat(id, participant);
        const chat = await db
          .selectFrom("chat")
          .selectAll()
          .where("id", "=", id)
          .executeTakeFirst();
        const participantCount = await db
          .selectFrom("participant")
          .where("userId", "in", participants)
          .execute();
        if (!lastTwo) {
          expect(chat).not.toBeUndefined();
          expect(participantCount).toHaveLength(participants.length - 1 - index);
          continue;
        }
        expect(chat).toBeUndefined();
        expect(participantCount).toHaveLength(0);
        break;
      }
    });
    it("removeParticipantFromChat rejects if chat does not exist or participant is not a member", async () => {
      const { id } = await service.createChat({ name: chatName, participants });
      const nonExistingParticipant = uniqueUUID(participants),
        nonExistingChat = uniqueUUID([id]);

      const testCases: { chatId: string; participant: string }[] = [
        { chatId: nonExistingChat, participant: participants[0] },
        { chatId: id, participant: nonExistingParticipant }
      ];

      for (const { chatId, participant } of testCases) {
        await expect(service.removeParticipantFromChat(chatId, participant)).rejects.toThrowError();
      }
    });
    it("createMessage adds message to existing chat", async () => {
      const { id } = await service.createChat({ participants });
      const createMessage: CreateMessageDto = {
        chatId: id,
        message: "message",
        userId: participants[0]
      };
      const message = await service.createMessage(createMessage);
      expect(message).not.toBeUndefined();
      messageProps.forEach((key) => {
        expect(message).toHaveProperty(key);
      });

      const newMessage = {
        chatId: createMessage.chatId,
        message: createMessage.message,
        userId: createMessage.userId
      };
      expect(newMessage).toEqual(createMessage);
      expect(message.deleted).toBe(false);
    });
    it("createMessage rejects if user is not participant and autoAdd is false", async () => {
      const { id } = await service.createChat({ participants });
      const createMessage: CreateMessageDto = {
        chatId: id,
        message: "message",
        userId: thirdCreated.id
      };
      await expect(service.createMessage(createMessage, false)).rejects.toThrowError();
    });
    it("createMessage allows posting from non-participants if autoAdd is true", async () => {
      const { id } = await service.createChat({ participants });
      const createMessage: CreateMessageDto = {
        chatId: id,
        message: "message",
        userId: thirdCreated.id
      };
      const createdMessage = await service.createMessage(createMessage, true);
      expect(createdMessage).not.toBeUndefined();
      messageProps.forEach((key) => {
        expect(createdMessage).toHaveProperty(key);
      });
    });
    it("createMessage rejects if chat or user do not exist", async () => {
      const { id } = await service.createChat({ participants });
      const inexistentUser = uniqueUUID(allUserIds);
      const inexistentChat = uniqueUUID([id]);
      await expect(
        service.createMessage({ chatId: id, message: "message", userId: inexistentUser })
      ).rejects.toThrowError();
      await expect(
        service.createMessage({
          chatId: inexistentChat,
          message: "message",
          userId: participants[0]
        })
      ).rejects.toThrowError();
    });
    it("getMessageCountForChat returns count", async () => {
      await expect(service.getMessageCountForChat("invalid")).rejects.toThrowError();
      for (const num of [1, 10, 20, 30]) {
        const { id } = await service.createChat({ participants });
        await insertMsgs(id, participants, num);
        await expect(service.getMessageCountForChat(id)).resolves.toBe(num);
        await service.deleteChats(firstCreated.id, id);
      }
    });
    it("getMessagesForChatParticipant returns ordered slice and total count of chat messages", async () => {
      const { id } = await service.createChat({ participants });
      const messages = await insertMsgs(id, participants, 20);
      const dateOffsets = messages.map(({ id, createdAt, updatedAt }, index) => {
        const newCreated = new Date(createdAt.getTime() + index * 10e5);
        return { id, createdAt: newCreated, updatedAt: newCreated };
      });
      const updatedMessages = await Promise.all(
        dateOffsets.map(({ id, ...rest }) =>
          db
            .updateTable("message")
            .set(rest)
            .where("id", "=", id)
            .returningAll()
            .executeTakeFirstOrThrow()
        )
      );
      // Promise.all preserves order and dates were set to be increasing.
      const updatedIdsAsc = updatedMessages.map(({ id }) => id);
      const updatedIdsDesc = [...updatedIdsAsc].reverse();
      const testCases: {
        options: { take?: number; skip?: number; direction?: "desc" | "asc" };
        expected: string[];
      }[] = [
        { options: {}, expected: updatedIdsDesc },
        { options: { direction: "asc" }, expected: updatedIdsAsc },
        { options: { take: 5 }, expected: updatedIdsDesc.slice(0, 5) },
        { options: { take: 5, skip: 5 }, expected: updatedIdsDesc.slice(5, 10) },
        { options: { take: 5, skip: 5, direction: "asc" }, expected: updatedIdsAsc.slice(5, 10) },
        { options: { take: 10, skip: 15, direction: "asc" }, expected: updatedIdsAsc.slice(15) }
      ];

      for (const { options, expected } of testCases) {
        const result = await service.getMessagesForChatParticipant(id, participants[0], options);
        expect(result.total).toBe(20);
        expect(result.messages.map(({ id }) => id)).toEqual(expected);
      }
    });
    it("getMessagesForChatParticipant rejects for non existing chats", async () => {
      await expect(
        service.getMessagesForChatParticipant(randomUUID(), participants[0])
      ).rejects.toThrowError();
    });
    it("getMessagesForChatParticipant if requested by non-participants", async () => {
      const { id } = await service.createChat({ participants });
      await insertMsgs(id, participants, 2);
      await expect(
        service.getMessagesForChatParticipant(id, thirdCreated.id)
      ).rejects.toThrowError();
    });
    it("toggleMessageDelete allows toggling delete status for message", async () => {
      const { id: chatId } = await service.createChat({ participants });
      const userId = participants[0];
      const { id: messageId, deleted } = await service.createMessage({
        chatId,
        userId,
        message: "message"
      });
      expect(deleted).toBe(false);
      const deletedMessage = await service.toggleMessageDelete(userId, messageId);
      expect(deletedMessage.deleted).toBe(true);
      const restoredMessage = await service.toggleMessageDelete(userId, messageId);
      expect(restoredMessage.deleted).toBe(false);
    });
    it("toggleMessageDelete rejects for non-authors", async () => {
      // First user is already an admin, so let's put non admins as participants
      const { id: chatId } = await service.createChat({
        participants: [secondCreated.id, thirdCreated.id]
      });
      const userId = secondCreated.id;
      const { id: messageId } = await service.createMessage({
        chatId,
        userId,
        message: "message"
      });
      const adminId = (
        await db
          .selectFrom("user as u")
          .leftJoin("admin as a", "a.id", "u.id")
          .select("u.id")
          .where("a.id", "is not", null)
          .executeTakeFirstOrThrow()
      ).id;

      await expect(service.toggleMessageDelete(adminId, messageId)).rejects.toThrowError();
      await expect(service.toggleMessageDelete(thirdCreated.id, messageId)).rejects.toThrowError();
    });
    it("setUnreadMessagesForParticipant  and getUnreadMessagesForParticipant set and retrieve number of unread messages respectively", async () => {
      const base = new Date("2024-01-01T12:00:00");
      const { id: chatId } = await service.createChat({ name: chatName, participants });
      // Update created and update manually, since postgres is running independently.
      await db.updateTable("chat").set({ createdAt: base, updatedAt: base }).execute();

      const userId = participants[0];
      const minuteInterval = 10;
      const messages = ["first", "second", "third"];
      for (const [message, index] of messages.map((val, i) => [val, i] as const)) {
        vi.setSystemTime(add(base, { minutes: index * minuteInterval }));
        const now = new Date();
        const { id } = await service.createMessage({ chatId, userId, message });
        // We have to manually change creation dates, since postgres is running independently
        await db
          .updateTable("message")
          .set({ createdAt: now, updatedAt: now })
          .where("id", "=", id)
          .execute();
      }

      for (const { time, expected } of [
        { time: -1, expected: messages.length },
        { time: minuteInterval - 1, expected: messages.length - 1 },
        { time: minuteInterval, expected: messages.length - 2 },
        { time: minuteInterval * 2, expected: 0 }
      ]) {
        vi.setSystemTime(add(base, { minutes: time }));
        await service.setParticipantChatAccess(chatId, userId);
        await expect(service.getUnreadMessagesForParticipant(chatId, userId)).resolves.toBe(
          expected
        );
      }
    });
  });
});
