import { randomUUID } from "crypto";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { db } from "./client.js";
import { DatabaseService } from "./db-service.js";
import type {
  AuthDto,
  BaseTableColumns,
  CreateUserDto,
  UpdateAuthDto,
  UpdateUserDto,
  UserDto
} from "./types.js";

describe("DatabaseService", () => {
  let dbService: DatabaseService;
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

    const userProps = ["username", "avatar", "email", "name", "surname"] satisfies (keyof Omit<
      UserDto,
      BaseTableColumns
    >)[];
    const authProps = ["hash", "salt"] satisfies (keyof Omit<AuthDto, BaseTableColumns>)[];
    beforeEach(() => {
      vi.useFakeTimers();
      dbService = new DatabaseService(db);
    });
    afterEach(async () => {
      await db.deleteFrom("user").execute();
      vi.useRealTimers();
    });
    it("User create should create and return user entry", async () => {
      const user = await dbService.createUser(userToCreate);
      expect(user).not.toBeUndefined();
      expectTypeOf(user).toMatchTypeOf<UserDto>();
      userProps.forEach((key) => {
        const createVal = userToCreate[key];

        createVal && expect(user[key]).toEqual(userToCreate[key]);
      });
    });
    it("Should throw if required fields are missing", async () => {
      const necessary = ["username", "email"] satisfies (keyof CreateUserDto)[];
      for (const required of necessary) {
        const cloneUser = JSON.parse(JSON.stringify(userToCreate)) as Record<string, unknown>;
        delete cloneUser[required];
        await expect(() => dbService.createUser(cloneUser as CreateUserDto)).rejects.toThrow();
      }
    });
    it("User create should create auth entry", async () => {
      const { id } = await dbService.createUser(userToCreate);
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
      const { id } = await dbService.createUser(userToCreate);
      const update: UpdateUserDto = { username: "other-user" };
      const updated = await dbService.updateUser(id, update);
      expectTypeOf(updated).toMatchTypeOf<UserDto>();
      expect(updated.updatedAt.getTime()).toBe(date.getTime());
    });
    it("Updating an inexistent user should throw", async () => {
      await dbService.createUser(userToCreate);
      await expect(
        dbService.updateUser(randomUUID(), { username: "other-user" })
      ).rejects.toThrowError();
    });
    it("Should create admin user", async () => {
      const user = await dbService.createAdminUser(userToCreate);
      expectTypeOf(user).toMatchTypeOf<UserDto>();
      const adminEntry = await db
        .selectFrom("admin")
        .select("id")
        .where("id", "=", user.id)
        .execute();
      expect(adminEntry.length).toBe(1);
    });
    it("Should reject admin creation if admin already exists", async () => {
      await dbService.createAdminUser(userToCreate);
      await expect(dbService.createAdminUser(otherUser)).rejects.toThrowError();
    });
    it("Should allow addAdmin if grantor is admin and grantee exists", async () => {
      const admin = await dbService.createAdminUser(userToCreate);
      const adminToBe = await dbService.createUser(otherUser);
      await dbService.addAdmin(admin.id, adminToBe.id);
      const isAdminToBeAdmin = await db
        .selectFrom("admin")
        .select("id")
        .where("id", "=", adminToBe.id)
        .executeTakeFirst();
      expect(isAdminToBeAdmin).not.toBeUndefined();
    });
    it("Should reject addAdmin if grantor does not exist", async () => {
      const adminToBe = await dbService.createUser(otherUser);
      await expect(dbService.addAdmin(randomUUID(), adminToBe.id)).rejects.toThrowError();
    });
    it("Should reject addAdmin if grantor is not admin", async () => {
      const nonAdmin = await dbService.createUser(userToCreate);
      const adminToBe = await dbService.createUser(otherUser);
      await expect(dbService.addAdmin(nonAdmin.id, adminToBe.id)).rejects.toThrowError();
    });
    it("Should reject addAdmin if grantee does not exist", async () => {
      const admin = await dbService.createAdminUser(userToCreate);
      await expect(dbService.addAdmin(admin.id, randomUUID())).rejects.toThrowError();
    });
    it("Update credentials", async () => {
      const { id } = await dbService.createUser(userToCreate);
      const date = new Date(3000, 0, 1, 12);
      vi.setSystemTime(date);
      const updateAuth: UpdateAuthDto = { hash: "new-hash", salt: "new-salt" };
      const updated = await dbService.updateCredentials(id, updateAuth);
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
});
