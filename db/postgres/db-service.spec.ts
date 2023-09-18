import { randomUUID } from "crypto";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { db } from "./client.js";
import { DatabaseService } from "./db-service.js";
import type {
  AuthDto,
  BaseTableColumns,
  CreateUserDto,
  SingleUserSearch,
  UpdateAuthDto,
  UpdateUserDto,
  UserDto
} from "./types.js";

describe("DatabaseService", () => {
  let service: DatabaseService;
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
      service = new DatabaseService(db);
    });
    afterEach(async () => {
      await db.deleteFrom("user").execute();
      vi.useRealTimers();
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
      const superAdmin = {
        ...userToCreate,
        username: "superadmin",
        email: "superadmin@nowhere.never"
      };
      await service.addUser(superAdmin);
      const nonAdmin = await service.addUser(userToCreate);
      const adminToBe = await service.addUser(otherUser);
      await expect(service.addAdmin(nonAdmin.id, adminToBe.id)).rejects.toThrowError();
    });
    it("Should reject addAdmin if grantee does not exist", async () => {
      const admin = await service.createSuperAdmin(userToCreate);
      await expect(service.addAdmin(admin.id, randomUUID())).rejects.toThrowError();
    });
    it("Should allow users to delete their account", async () => {
      const { id } = await service.addUser(userToCreate);
      await service.removeUser(id, id);
      expect(await db.selectFrom("user").execute()).toEqual([]);
    });
    it("Should reject if users try to delete other users", async () => {
      const superAdmin = {
        ...userToCreate,
        username: "superadmin",
        email: "superadmin@nowhere.never"
      };
      await service.createSuperAdmin(superAdmin);
      const [first, second] = await Promise.all(
        [userToCreate, otherUser].map((u) => service.addUser(u))
      );
      await expect(service.removeUser(first.id, second.id)).rejects.toThrowError();
    });
    it("Should allow admins to remove other users", async () => {
      const { id } = await service.addUser(userToCreate);
      await service.removeUser(id, id);
      expect(await db.selectFrom("user").execute()).toEqual([]);
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
      await expect(service.removeAdmin(nonPrivilegedUser.id, superAdmin.id)).rejects.toThrowError();

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
    it("Update credentials", async () => {
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
    it("Should get user by unique column value", async () => {
      const firstUser = await service.addUser(userToCreate),
        secondUser = await service.addUser(otherUser);
      const { id: thirdUserId } = await service.addUser({
        ...otherUser,
        email: "third-user",
        username: "third-user"
      });
      await db.deleteFrom("user").where("id", "=", thirdUserId).execute();
      const testCases: { search: SingleUserSearch; expected: UserDto | undefined }[] = [
        { search: { property: "id", value: firstUser.id }, expected: firstUser },
        { search: { property: "id", value: thirdUserId }, expected: undefined },
        { search: { property: "username", value: secondUser.username }, expected: secondUser },
        { search: { property: "username", value: "inexistent" }, expected: undefined },
        { search: { property: "email", value: secondUser.email }, expected: secondUser },
        { search: { property: "email", value: "inexistent" }, expected: undefined }
      ];

      for (const { search, expected } of testCases) {
        expect(await service.getUser(search)).toEqual(expected);
      }
    });
  });
});
