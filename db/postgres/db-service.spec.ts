import { randomUUID } from "crypto";
import * as dotenv from "dotenv";

import { CamelCasePlugin, Kysely, Migrator, PostgresDialect } from "kysely";
import pg from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi
} from "vitest";
import { DatabaseService } from "./db-service.js";
import { DB } from "./db-types.js";
import { ESMFileMigrationProvider, MigrationHelper } from "./tools/migrator.js";
import {
  ChatWithParticipantsDto,
  ParticipantDto,
  type AuthDto,
  type BaseTableColumns,
  type CreateChatDto,
  type CreateUserDto,
  type SingleUserSearch,
  type UpdateAuthDto,
  type UpdateUserDto,
  type UserDto
} from "./types.js";
const { Pool, Client } = pg;

dotenv.configDotenv({ path: new URL("../../.env", import.meta.url).pathname.substring(1) });

const TEST_DB_NAME = "test_db";
const postgresConnection = {
  database: process.env["POSTGRES_POSTGRES_DB"],
  host: process.env["POSTGRES_HOST"],
  user: process.env["POSTGRES_USER"],
  password: process.env["POSTGRES_PASSWORD"],
  port: Number(process.env["POSTGRES_PORT"]) | 5432
};
const MIGRATIONS_PATH = new URL("./migrations", import.meta.url),
  TYPE_PATH = new URL("./db-types.ts", import.meta.url).pathname.substring(1);

// Create test database before creating a connection to it
const postgresClient = new Client(postgresConnection);
await postgresClient.connect();
await postgresClient.query(`CREATE DATABASE "${TEST_DB_NAME}"`);

// Create connection to test database
const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({ ...postgresConnection, database: TEST_DB_NAME })
    }),
    plugins: [new CamelCasePlugin()]
  }),
  migrator = new Migrator({ db, provider: new ESMFileMigrationProvider(MIGRATIONS_PATH) });

const migrationHelper = new MigrationHelper(db as Kysely<unknown>, migrator, TYPE_PATH);
describe("DatabaseService", () => {
  let service: DatabaseService;
  const firstUser: CreateUserDto = {
    username: "new_user_123",
    name: "Name",
    surname: "Surname",
    email: "name@surname.nowhere",
    avatar: "some-avatar-data",
    hash: "password-hash",
    salt: "password-salt"
  };
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
    await migrationHelper.migrateToLatest();
    service = new DatabaseService(db);
  });
  afterAll(async () => {
    await db.destroy();
    await postgresClient.query(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE)`);
    await postgresClient.end();
  });
  describe("Users", () => {
    const userProps = ["username", "avatar", "email", "name", "surname"] satisfies (keyof Omit<
      UserDto,
      BaseTableColumns
    >)[];
    const authProps = ["hash", "salt"] satisfies (keyof Omit<AuthDto, BaseTableColumns>)[];
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });
    describe("User CRUD", () => {
      afterEach(async () => {
        await db.deleteFrom("user").execute();
      });
      it("User create should create and return user entry", async () => {
        const user = await service.addUser(firstUser);
        expect(user).not.toBeUndefined();
        expectTypeOf(user).toMatchTypeOf<UserDto>();
        userProps.forEach((key) => {
          const createVal = firstUser[key];

          createVal && expect(user[key]).toEqual(firstUser[key]);
        });
      });
      it("Initial user should be created as super admin", async () => {
        const { id } = await service.addUser(firstUser);
        expect(
          await db
            .selectFrom("admin")
            .select("id")
            .where((eb) => eb.and([eb("id", "=", id), eb("superAdmin", "=", true)]))
            .executeTakeFirst()
        ).toEqual({ id });
      });
      it("Should throw if required fields are missing", async () => {
        const necessary = ["username", "email"] satisfies (keyof CreateUserDto)[];
        for (const required of necessary) {
          const cloneUser = JSON.parse(JSON.stringify(firstUser)) as Record<string, unknown>;
          delete cloneUser[required];
          await expect(() => service.addUser(cloneUser as CreateUserDto)).rejects.toThrow();
        }
      });
      it("User create should create auth entry", async () => {
        const { id } = await service.addUser(firstUser);
        const authEntry = await db
          .selectFrom("auth")
          .selectAll()
          .where("id", "=", id)
          .executeTakeFirstOrThrow();

        expectTypeOf(authEntry).toMatchTypeOf<AuthDto>();

        authProps.forEach((key) => {
          expect(authEntry[key]).toEqual(firstUser[key]);
        });
      });
      it("Should update user and insert updatedAt time", async () => {
        const date = new Date(3000, 0, 1, 12);
        vi.setSystemTime(date);
        const { id } = await service.addUser(firstUser);
        const update: UpdateUserDto = { username: "other-user" };
        const updated = await service.updateUser(id, update);
        expectTypeOf(updated).toMatchTypeOf<UserDto>();
        expect(updated.updatedAt.getTime()).toBe(date.getTime());
      });
      it("Updating an inexistent user should throw", async () => {
        await service.addUser(firstUser);
        await expect(
          service.updateUser(randomUUID(), { username: "other-user" })
        ).rejects.toThrowError();
      });
      it("Should allow users to delete their account", async () => {
        await service.addUser(firstUser);
        const { id } = await service.addUser(secondUser);
        await service.removeUser(id, id);
        expect(await db.selectFrom("user").where("id", "=", id).execute()).toEqual([]);
      });
      it("User deletions should cascade", async () => {
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
      it("Should reject if users try to delete other users", async () => {
        await service.createSuperAdmin(superAdmin);
        const [first, second] = await Promise.all(
          [firstUser, secondUser].map((u) => service.addUser(u))
        );
        await expect(service.removeUser(first.id, second.id)).rejects.toThrowError();
      });
      it("Update user credentials", async () => {
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
      it("First user should be created as superAdmin", async () => {
        const { id } = await service.addUser(firstUser);
        const superAdminFetch = await db
          .selectFrom("admin")
          .where((eb) => eb.and([eb("id", "=", id), eb("superAdmin", "=", true)]))
          .executeTakeFirst();
        expect(superAdminFetch).not.toBeNull();
      });
      it("Should create admin user", async () => {
        const user = await service.createSuperAdmin(firstUser);
        expectTypeOf(user).toMatchTypeOf<UserDto>();
        const adminEntry = await db
          .selectFrom("admin")
          .select("id")
          .where("id", "=", user.id)
          .execute();
        expect(adminEntry.length).toBe(1);
      });
      it("Should reject super admin creation if super admin already exists", async () => {
        await service.addUser(firstUser);
        await expect(service.createSuperAdmin(secondUser)).rejects.toThrowError();
      });
      it("Should allow addAdmin if grantor is admin and grantee exists", async () => {
        const admin = await service.createSuperAdmin(firstUser);
        const adminToBe = await service.addUser(secondUser);
        await service.addAdmin(admin.id, adminToBe.id);
        const isAdminToBeAdmin = await db
          .selectFrom("admin")
          .select("id")
          .where("id", "=", adminToBe.id)
          .executeTakeFirst();
        expect(isAdminToBeAdmin).not.toBeUndefined();
      });
      it("Should reject addAdmin if superAdmin does not exist", async () => {
        const adminToBe = await service.addUser(secondUser);
        await expect(service.addAdmin(randomUUID(), adminToBe.id)).rejects.toThrowError();
      });
      it("Should reject addAdmin if grantor is not superAdmin", async () => {
        await service.addUser(superAdmin);
        const nonAdmin = await service.addUser(firstUser);
        const adminToBe = await service.addUser(secondUser);
        await expect(service.addAdmin(nonAdmin.id, adminToBe.id)).rejects.toThrowError();
      });
      it("Should reject addAdmin if grantee does not exist", async () => {
        const admin = await service.createSuperAdmin(firstUser);
        await expect(service.addAdmin(admin.id, randomUUID())).rejects.toThrowError();
      });
      it("Should transfer superAdmin role", async () => {
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
      it("Should not allow super admins to delete their account", async () => {
        const { id } = await service.addUser(firstUser);
        await expect(service.removeUser(id, id)).rejects.toThrowError();
      });
      it("Should allow admins to remove other users", async () => {
        const { id: superAdminId } = await service.addUser(superAdmin);
        const { id: adminId } = await service.addUser(firstUser);
        const { id } = await service.addUser(secondUser);
        await service.addAdmin(superAdminId, adminId);
        await service.removeUser(adminId, id);
        expect(await db.selectFrom("user").select("id").where("id", "=", id).execute()).toEqual([]);
      });
      it("Should remove admin", async () => {
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
      it("Should reject admin removal if acting user is not super admin", async () => {
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
      it("Should not allow super admins to delete remove themselves", async () => {
        const { id } = await service.addUser(firstUser);
        await expect(service.removeAdmin(id, id)).rejects.toThrowError();
      });
      it("Should reject admin removal if acting user does not exist", async () => {
        const admin = await service.createSuperAdmin(firstUser);
        await expect(service.removeAdmin("inexistent", admin.id)).rejects.toThrowError();
      });
      it("Should reject admin removal if target user is not admin", async () => {
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
      let firstCreated: UserDto, secondCreated: UserDto, thirdCreated: UserDto;
      beforeEach(async () => {
        firstCreated = await service.addUser(firstToCreate);
        secondCreated = await service.addUser(secondToCreate);
        thirdCreated = await service.addUser(thirdToCreate);
      });
      afterEach(async () => {
        await db.deleteFrom("user").execute();
      });
      it("Should get user by unique column value", async () => {
        await db.deleteFrom("user").where("id", "=", thirdCreated.id).execute();
        const testCases: { search: SingleUserSearch; expected: UserDto | undefined }[] = [
          { search: { property: "id", value: firstCreated.id }, expected: firstCreated },
          { search: { property: "id", value: thirdCreated.id }, expected: undefined },
          {
            search: { property: "username", value: secondCreated.username },
            expected: secondCreated
          },
          { search: { property: "username", value: "inexistent" }, expected: undefined },
          { search: { property: "email", value: secondCreated.email }, expected: secondCreated },
          { search: { property: "email", value: "inexistent" }, expected: undefined }
        ];

        for (const { search, expected } of testCases) {
          expect(await service.getUser(search)).toEqual(expected);
        }
      });
      it("Should perform a case insensitive search for users", async () => {
        const testCases: { search: string; expected: number }[] = [
          { search: "123", expected: 2 },
          { search: "doe", expected: 2 },
          { search: "jAnE", expected: 1 },
          { search: "person", expected: 1 }
        ];
        for (const { search, expected } of testCases) {
          expect((await service.searchForUsers(search)).length).toBe(expected);
        }
      });
    });
  });

  describe.only("Chats constellation CRUD", () => {
    let firstCreated: UserDto,
      secondCreated: UserDto,
      thirdCreated: UserDto,
      participants: string[];
    const chatName = "chatName";

    beforeAll(async () => {
      firstCreated = await service.addUser(firstUser);
      secondCreated = await service.addUser(secondUser);
      thirdCreated = await service.addUser(thirdUser);
      participants = [firstCreated.id, secondCreated.id];
    });
    afterEach(async () => {
      await db.deleteFrom("chat").execute();
    });
    afterAll(async () => {
      await db.deleteFrom("user").execute();
    });
    it("Should create chat and participant entries", async () => {
      const createChat: CreateChatDto = { name: chatName, participants };

      const { id, participants: returnedParticipants } = await service.createChat(createChat);
      expect(returnedParticipants).toEqual(participants);

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
    it("Should reject chat creation with less than two participants", async () => {
      await expect(
        service.createChat({ name: chatName, participants: participants.slice(0, 1) })
      ).rejects.toThrowError();
    });
    it("Should add participants to existing chats", async () => {
      const { id } = await service.createChat({ name: chatName, participants });
      const participant = await service.addParticipantToChat(id, thirdCreated.id);
      expect(participant).not.toBeUndefined();
      expectTypeOf(participant).toMatchTypeOf<ParticipantDto>();
    });
    it("Should reject if chat or user does not exist or is already added", async () => {
      const { id } = await service.createChat({ name: chatName, participants });
      let nonExistingParticipant = "",
        nonExistingChat = "";
      while (!nonExistingChat || nonExistingChat === id) {
        nonExistingChat = randomUUID();
      }
      while (!nonExistingParticipant || participants.find((id) => nonExistingParticipant === id)) {
        nonExistingParticipant = randomUUID();
      }
      const testCases: { chatId: string; userId: string }[] = [
        { chatId: id, userId: nonExistingParticipant },
        { chatId: nonExistingChat, userId: thirdCreated.id },
        { chatId: id, userId: participants[0] }
      ];

      for (const { chatId, userId } of testCases) {
        await expect(service.addParticipantToChat(chatId, userId)).rejects.toThrowError();
      }
    });
    it("Should get chat", async () => {
      const allParticipants = [...participants, thirdCreated.id];
      const { id } = await service.createChat({ name: chatName, participants: allParticipants });
      const returnedChat = await service.getChat(id);
      expect(returnedChat).not.toBeUndefined();
      expectTypeOf(returnedChat).toMatchTypeOf<ChatWithParticipantsDto>();
      expect(returnedChat?.name).toBe(chatName);
      expect(returnedChat?.participants).toEqual(allParticipants);
    });
    it("Should return undefined for inexisting chats", async () => {
      const { id } = await service.createChat({ name: chatName, participants });
      await db.deleteFrom("chat").execute();
      expect(await service.getChat(id)).toBeUndefined();
    });
    it("Should remove participant from chat", async () => {
      const { id } = await service.createChat({ name: chatName, participants });
      expect(await service.removeParticipantFromChat(id, participants[0])).toBe(true);

      const participantRemoved = await db
        .selectFrom("participant")
        .selectAll()
        .where("userId", "=", participants[0])
        .executeTakeFirst();

      expect(participantRemoved).toBeUndefined();

      const chatRemains = await db
        .selectFrom("chat")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();
      expect(chatRemains).not.toBeUndefined();
    });
    it("Should remove chat, if only a single participant remains", async () => {
      const { id } = await service.createChat({ name: chatName, participants });
      for (const participant of participants) {
        await service.removeParticipantFromChat(id, participant);
      }
      const chatRemoved = await db
        .selectFrom("chat")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();
      expect(chatRemoved).toBeUndefined();

      const noParticipants = await db
        .selectFrom("participant")
        .where("userId", "in", participants)
        .execute();
      expect(noParticipants.length).toBe(0);
    });
    it("Should reject if chat does not exist or participant is not a member", async () => {
      const { id } = await service.createChat({ name: chatName, participants });
      let nonExistingParticipant = "",
        nonExistingChat = "";
      while (!nonExistingChat || nonExistingChat === id) {
        nonExistingChat = randomUUID();
      }
      while (!nonExistingParticipant || participants.find((id) => nonExistingParticipant === id)) {
        nonExistingParticipant = randomUUID();
      }
      const testCases: { chatId: string; participant: string }[] = [
        { chatId: nonExistingChat, participant: participants[0] },
        { chatId: id, participant: nonExistingParticipant }
      ];

      for (const { chatId, participant } of testCases) {
        await expect(service.removeParticipantFromChat(chatId, participant)).rejects.toThrowError();
      }
    });
  });
});
