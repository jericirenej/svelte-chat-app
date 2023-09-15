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
    const userProps = ["username", "avatar", "email", "name", "surname"] satisfies (keyof Omit<
      UserDto,
      BaseTableColumns
    >)[];
    const authProps = ["hash", "salt"] satisfies (keyof Omit<AuthDto, BaseTableColumns>)[];
    beforeEach(async () => {
      vi.useFakeTimers();

      await db.deleteFrom("user").execute();
      dbService = new DatabaseService(db);
    });
    afterEach(() => {
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
