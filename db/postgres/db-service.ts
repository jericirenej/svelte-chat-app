import { Kysely } from "kysely";
import { DB, User } from "./db-types.js";
import {
  AdminDto,
  BaseTableColumns,
  CreateUserDto,
  SingleUserSearch,
  UpdateAuthDto,
  UpdateUserDto,
  UserDto
} from "./types.js";

type PrivilegeType = "user" | "admin" | "superAdmin";
type EntityCheckObj = {
  executorId: string;
  executorType?: PrivilegeType;
  targetId: string;
  targetType?: PrivilegeType;
};

export class DatabaseService {
  constructor(protected db: Kysely<DB>) {}

  // GET ENTITIES

  /** Search for user by their unique property. Full match required. */
  async getUser({ property, value }: SingleUserSearch): Promise<UserDto | undefined> {
    return await this.db
      .selectFrom("user")
      .selectAll()
      .where(property, "=", value)
      .executeTakeFirst();
  }

  async searchForUsers(search: string): Promise<UserDto[]> {
    const props = ["name", "surname", "username"] satisfies (keyof User)[];
    const query = this.db
      .selectFrom("user")
      .selectAll()
      .where((eb) => eb.or(props.map((prop) => eb(eb.ref(prop), "ilike", `%${search}%`))));

    console.log(query.compile());
    return await query.execute();
  }

  async getAdmin(id: string): Promise<AdminDto | undefined> {
    return this.db.selectFrom("admin").selectAll().where("id", "=", id).executeTakeFirst();
  }

  // CREATE ENTITIES

  /** Queries needed for creating the user and corresponding credentials entries
   * Should be called within a transaction. */
  async #createNewUserInserts(
    db: Kysely<DB>,
    { username, name, surname, email, avatar, hash, salt }: CreateUserDto
  ): Promise<UserDto> {
    const newUser = await db
      .insertInto("user")
      .values({ username, name, surname, email, avatar })
      .returningAll()
      .executeTakeFirstOrThrow();
    await db.insertInto("auth").values({ id: newUser.id, hash, salt }).execute();
    return newUser;
  }

  /** Create new user, along with their passed credentials. Initial user created as superadmin. */
  async addUser(createUserDto: CreateUserDto): Promise<UserDto> {
    const noUsers = await this.#usersExist();
    if (noUsers) {
      return await this.createSuperAdmin(createUserDto);
    }
    const user = await this.db.transaction().execute<UserDto | undefined>(async (trx) => {
      return await this.#createNewUserInserts(trx, createUserDto);
    });
    if (!user) throw new Error("Error creating user");
    return user;
  }

  /** Create initial superAdmin user, along with their passed credentials.
   * Can only be used if no users exist. */
  async createSuperAdmin(createUserArgs: CreateUserDto): Promise<UserDto> {
    // Safeguard against standalone calls
    const { adminCount } = await this.db
      .selectFrom("admin")
      .select((eb) => eb.fn.countAll().as("adminCount"))
      .where("superAdmin", "=", true)
      .executeTakeFirstOrThrow();

    if (BigInt(adminCount) !== 0n) {
      throw new Error("Super administrator already exists!");
    }

    const user = await this.db.transaction().execute<UserDto | undefined>(async (trx) => {
      const newUser = await this.#createNewUserInserts(trx, createUserArgs);
      await trx.insertInto("admin").values({ id: newUser.id, superAdmin: true }).execute();
      return newUser;
    });
    if (!user) throw new Error("Error creating user");
    return user;
  }

  async transferSuperAdmin(executorId: string, targetId: string): Promise<boolean> {
    await this.#executorAndTargetCheck({ executorId, executorType: "superAdmin", targetId });
    return await this.db.transaction().execute(async (trx) => {
      try {
        await trx.deleteFrom("admin").where("id", "=", executorId).execute();
        await trx.insertInto("admin").values({ id: targetId, superAdmin: true }).execute();
        return true;
      } catch (err) {
        console.warn(
          "Transferring of super administrator role failed:",
          err instanceof Error ? err.message : err
        );
        return false;
      }
    });
  }

  async addAdmin(executorId: string, targetId: string): Promise<true> {
    await this.#executorAndTargetCheck({ executorId, executorType: "superAdmin", targetId });

    await this.db.insertInto("admin").values({ id: targetId }).execute();
    return true;
  }

  // UPDATE ENTITIES

  /** Update user properties. Overriding id's is forbidden.*/
  async updateUser(id: string, arg: UpdateUserDto): Promise<UserDto> {
    this.#forbidBaseColumns(arg);
    const updated = await this.db
      .updateTable("user")
      .set({ ...arg, updatedAt: new Date() })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    if (!updated) {
      throw new Error(`Error while updating user with id: ${id}`);
    }
    return updated;
  }

  async updateCredentials(id: string, arg: UpdateAuthDto): Promise<true> {
    this.#forbidBaseColumns(arg);
    await this.db
      .updateTable("auth")
      .set({ ...arg, updatedAt: new Date() })
      .where("id", "=", id)
      .execute();
    return true;
  }

  // DELETE ENTITIES

  async removeUser(executorId: string, targetId: string): Promise<true> {
    await this.canUserDeleteUser(executorId, targetId);
    await this.db.deleteFrom("user").where("id", "=", targetId).execute();
    return true;
  }

  async removeAdmin(executorId: string, toBeRemovedId: string): Promise<true> {
    const isSuperAdmin = await this.#isSuperAdmin(executorId);

    if (!isSuperAdmin) {
      throw new Error("Super administrator does not exist!");
    }

    if (executorId === toBeRemovedId) {
      throw new Error("Super administrator cannot remove themselves!");
    }
    const targetAdminExists = await this.#isAdmin(toBeRemovedId);

    if (!targetAdminExists) {
      throw new Error("Target admin does not exist!");
    }
    await this.db.deleteFrom("admin").where("id", "=", toBeRemovedId).execute();
    return true;
  }

  // AUTHORIZATION GUARDS
  // Assert user is authorized to delete users.
  async canUserDeleteUser(executorId: string, targetId: string): Promise<void> {
    if (executorId === targetId) {
      const isUserSuperAdmin = await this.#isSuperAdmin(executorId);
      if (isUserSuperAdmin) {
        throw new Error(
          "Super administrators cannot delete their own account without privilege transfer!"
        );
      }
      return;
    }
    const isUserAdmin = await this.getAdmin(executorId);
    if (!isUserAdmin) {
      throw new Error("Only administrators can delete accounts of other users!");
    }
    const isOtherUserAdmin = await this.#isAdmin(targetId);
    if (isOtherUserAdmin && !isUserAdmin.superAdmin) {
      throw new Error("Only super administrators can delete other administrators!");
    }
    return;
  }

  // canRemoveAdmins
  // UTILITY METHODS

  /** Prevent external modification of base table columns, such as `id`, `createdDate`, `updatedDate` */
  #forbidBaseColumns<T extends Record<string, unknown>>(arg: T): void {
    const baseColumns: BaseTableColumns[] = ["createdAt", "id", "updatedAt"];
    if (baseColumns.some((col) => col in arg)) {
      throw new Error(`The following base columns are not allowed: ${baseColumns.join(", ")}.`);
    }
  }

  async #entryExists(table: keyof DB, id: string): Promise<boolean> {
    const entry = await this.db
      .selectFrom(table)
      .select("id")
      .where(`${table}.id`, "=", id)
      .executeTakeFirst();
    return !!entry;
  }

  async #isAdmin(adminId: string): Promise<boolean> {
    const entry = await this.db
      .selectFrom("user as u")
      .select("u.id")
      .where((eb) =>
        eb.and([
          eb("u.id", "in", eb.selectFrom("admin as a").select("a.id")),
          eb("u.id", "=", adminId)
        ])
      )
      .executeTakeFirst();
    return !!entry;
  }

  async #isSuperAdmin(adminId: string): Promise<boolean> {
    const findSuperAdmin = await this.db
      .selectFrom("admin")
      .select("id")
      .where((eb) => eb.and([eb("id", "=", adminId), eb("superAdmin", "=", true)]))
      .executeTakeFirst();
    return !!findSuperAdmin;
  }

  async #isUser(userId: string): Promise<boolean> {
    return await this.#entryExists("user", userId);
  }

  async #usersExist(): Promise<boolean> {
    const { userCount } = await this.db
      .selectFrom("user")
      .select((eb) => eb.fn.countAll().as("userCount"))
      .executeTakeFirstOrThrow();

    return BigInt(userCount) === 0n;
  }

  async #executorAndTargetCheck({
    executorId,
    targetId,
    executorType = "user",
    targetType = "user"
  }: EntityCheckObj): Promise<void> {
    const methodPick: Record<PrivilegeType, (id: string) => Promise<boolean>> = {
      user: this.#isUser.bind(this),
      admin: this.#isAdmin.bind(this),
      superAdmin: this.#isSuperAdmin.bind(this)
    };
    const executorMethod = methodPick[executorType],
      targetMethod = methodPick[targetType];
    const executorAllowed = await executorMethod(executorId);
    if (!executorAllowed) {
      throw new Error(
        "User does not exist or does not have permissions to perform the requested action!"
      );
    }

    const targetAllowed = await targetMethod(targetId);
    if (!targetAllowed) {
      throw new Error(
        "Target user does not exist or does not have the appropriate privilege type!"
      );
    }
  }

  /* async getUserByUsername(username: string):Promise<UserDto> {
    await this.db.selectFrom("user").select
  } */
}
