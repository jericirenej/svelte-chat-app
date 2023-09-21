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
import type {
  AuthDto,
  BaseTableColumns,
  CreateUserDto,
  SingleUserSearch,
  UpdateAuthDto,
  UpdateUserDto,
  UserDto
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
    const userToCreate: CreateUserDto = {
      username: "new_user_123",
      name: "Name",
      surname: "Surname",
      email: "name@surname.nowhere",
      avatar: "some-avatar-data",
      hash: "password-hash",
      salt: "password-salt"
    };
    const otherUser = {
      ...userToCreate,
      email: "other.user@nowhere",
      username: "other_user_123",
      hash: "other-password-hash",
      salt: "other-password-salt"
    };
    const superAdmin = {
      ...userToCreate,
      username: "superadmin",
      email: "superadmin@nowhere.never"
    };

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
        const user = await service.addUser(userToCreate);
        expect(user).not.toBeUndefined();
        expectTypeOf(user).toMatchTypeOf<UserDto>();
        userProps.forEach((key) => {
          const createVal = userToCreate[key];

          createVal && expect(user[key]).toEqual(userToCreate[key]);
        });
      });
      it("Initial user should be created as super admin", async () => {
        const { id } = await service.addUser(userToCreate);
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
          const cloneUser = JSON.parse(JSON.stringify(userToCreate)) as Record<string, unknown>;
          delete cloneUser[required];
          await expect(() => service.addUser(cloneUser as CreateUserDto)).rejects.toThrow();
        }
      });
      it("User create should create auth entry", async () => {
        const { id } = await service.addUser(userToCreate);
        const authEntry = await db
          .selectFrom("auth")
          .selectAll()
          .where("id", "=", id)
          .executeTakeFirstOrThrow();

        expectTypeOf(authEntry).toMatchTypeOf<AuthDto>();

        authProps.forEach((key) => {
          expect(authEntry[key]).toEqual(userToCreate[key]);
        });
      });
      it("Should update user and insert updatedAt time", async () => {
        const date = new Date(3000, 0, 1, 12);
        vi.setSystemTime(date);
        const { id } = await service.addUser(userToCreate);
        const update: UpdateUserDto = { username: "other-user" };
        const updated = await service.updateUser(id, update);
        expectTypeOf(updated).toMatchTypeOf<UserDto>();
        expect(updated.updatedAt.getTime()).toBe(date.getTime());
      });
      it("Updating an inexistent user should throw", async () => {
        await service.addUser(userToCreate);
        await expect(
          service.updateUser(randomUUID(), { username: "other-user" })
        ).rejects.toThrowError();
      });
      it("Should allow users to delete their account", async () => {
        await service.addUser(userToCreate);
        const { id } = await service.addUser(otherUser);
        await service.removeUser(id, id);
        expect(await db.selectFrom("user").where("id", "=", id).execute()).toEqual([]);
      });
      it("User deletions should cascade", async () => {
        await service.addUser(superAdmin);
        const { id } = await service.addUser(userToCreate);
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
          [userToCreate, otherUser].map((u) => service.addUser(u))
        );
        await expect(service.removeUser(first.id, second.id)).rejects.toThrowError();
      });
      it("Update user credentials", async () => {
        const { id } = await service.addUser(userToCreate);
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
        const { id } = await service.addUser(userToCreate);
        const superAdminFetch = await db
          .selectFrom("admin")
          .where((eb) => eb.and([eb("id", "=", id), eb("superAdmin", "=", true)]))
          .executeTakeFirst();
        expect(superAdminFetch).not.toBeNull();
      });
      it("Should create admin user", async () => {
        const user = await service.createSuperAdmin(userToCreate);
        expectTypeOf(user).toMatchTypeOf<UserDto>();
        const adminEntry = await db
          .selectFrom("admin")
          .select("id")
          .where("id", "=", user.id)
          .execute();
        expect(adminEntry.length).toBe(1);
      });
      it("Should reject super admin creation if super admin already exists", async () => {
        await service.addUser(userToCreate);
        await expect(service.createSuperAdmin(otherUser)).rejects.toThrowError();
      });
      it("Should allow addAdmin if grantor is admin and grantee exists", async () => {
        const admin = await service.createSuperAdmin(userToCreate);
        const adminToBe = await service.addUser(otherUser);
        await service.addAdmin(admin.id, adminToBe.id);
        const isAdminToBeAdmin = await db
          .selectFrom("admin")
          .select("id")
          .where("id", "=", adminToBe.id)
          .executeTakeFirst();
        expect(isAdminToBeAdmin).not.toBeUndefined();
      });
      it("Should reject addAdmin if superAdmin does not exist", async () => {
        const adminToBe = await service.addUser(otherUser);
        await expect(service.addAdmin(randomUUID(), adminToBe.id)).rejects.toThrowError();
      });
      it("Should reject addAdmin if grantor is not superAdmin", async () => {
        await service.addUser(superAdmin);
        const nonAdmin = await service.addUser(userToCreate);
        const adminToBe = await service.addUser(otherUser);
        await expect(service.addAdmin(nonAdmin.id, adminToBe.id)).rejects.toThrowError();
      });
      it("Should reject addAdmin if grantee does not exist", async () => {
        const admin = await service.createSuperAdmin(userToCreate);
        await expect(service.addAdmin(admin.id, randomUUID())).rejects.toThrowError();
      });
      it("Should transfer superAdmin role", async () => {
        const { id: superAdminId } = await service.addUser(superAdmin);
        const { id } = await service.addUser(userToCreate);
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
        const { id } = await service.addUser(userToCreate);
        await expect(service.removeUser(id, id)).rejects.toThrowError();
      });
      it("Should allow admins to remove other users", async () => {
        const { id: superAdminId } = await service.addUser(superAdmin);
        const { id: adminId } = await service.addUser(userToCreate);
        const { id } = await service.addUser(otherUser);
        await service.addAdmin(superAdminId, adminId);
        await service.removeUser(adminId, id);
        expect(await db.selectFrom("user").select("id").where("id", "=", id).execute()).toEqual([]);
      });
      it("Should remove admin", async () => {
        const admin = await service.createSuperAdmin(userToCreate);
        const secondAdmin = await service.addUser(otherUser);
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
        const superAdmin = await service.addUser(userToCreate);
        const nonPrivilegedUser = await service.addUser(otherUser);
        await expect(
          service.removeAdmin(nonPrivilegedUser.id, superAdmin.id)
        ).rejects.toThrowError();

        const nonSuperAdmin = await service.addUser({
          ...otherUser,
          username: "third-user",
          email: "third@nowhere.never"
        });
        await service.addAdmin(superAdmin.id, nonSuperAdmin.id);
        await expect(service.removeAdmin(nonSuperAdmin.id, superAdmin.id)).rejects.toThrowError();
      });
      it("Should not allow super admins to delete remove themselves", async () => {
        const { id } = await service.addUser(userToCreate);
        await expect(service.removeAdmin(id, id)).rejects.toThrowError();
      });
      it("Should reject admin removal if acting user does not exist", async () => {
        const admin = await service.createSuperAdmin(userToCreate);
        await expect(service.removeAdmin("inexistent", admin.id)).rejects.toThrowError();
      });
      it("Should reject admin removal if target user is not admin", async () => {
        const admin = await service.createSuperAdmin(userToCreate);
        const nonPrivilegedUser = await service.addUser(otherUser);
        await expect(service.removeAdmin(admin.id, nonPrivilegedUser.id)).rejects.toThrowError();
      });
    });
    describe.only("User search", () => {
      const firstToCreate: CreateUserDto = {
          ...userToCreate,
          name: "Albert",
          surname: "Einstein",
          username: "smart_einstein",
          email: "albert.einstein@nowhere.com"
        },
        secondToCreate: CreateUserDto = {
          ...userToCreate,
          name: "Albertina",
          surname: "Hegel",
          username: "albertina_not_georg",
          email: "albertina.hegel@nowhere.com"
        },
        thirdToCreate: CreateUserDto = {
          ...userToCreate,
          name: undefined,
          surname: "Hegel",
          username: "hegel",
          email: "unknown.hegel@nowhere.com"
        };
      let firstUser: UserDto, secondUser: UserDto, thirdUser: UserDto;
      beforeAll(async () => {
        firstUser = await service.addUser(firstToCreate);
        secondUser = await service.addUser(secondToCreate);
        thirdUser = await service.addUser(thirdToCreate);
        console.log("THIRD", thirdUser);
      });
      afterAll(async () => {
        await db.deleteFrom("user").execute();
      });
      it("Should get user by unique column value", async () => {
        await db.deleteFrom("user").where("id", "=", thirdUser.id).execute();
        const testCases: { search: SingleUserSearch; expected: UserDto | undefined }[] = [
          { search: { property: "id", value: firstUser.id }, expected: firstUser },
          { search: { property: "id", value: thirdUser.id }, expected: undefined },
          { search: { property: "username", value: secondUser.username }, expected: secondUser },
          { search: { property: "username", value: "inexistent" }, expected: undefined },
          { search: { property: "email", value: secondUser.email }, expected: secondUser },
          { search: { property: "email", value: "inexistent" }, expected: undefined }
        ];

        for (const { search, expected } of testCases) {
          expect(await service.getUser(search)).toEqual(expected);
        }
      });
      it("Should perform a case insensitive search for users", async () => {
        console.log("ALL USERS", await db.selectFrom("user").selectAll().execute());
        const result = await service.searchForUsers("hegel");
        console.log("RESULT", result);
      });
    });
  });
});
