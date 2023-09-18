import { Kysely } from "kysely";
import { DB } from "./db-types.js";
import {
  AdminDto,
  BaseTableColumns,
  CreateUserDto,
  SingleUserSearch,
  UpdateAuthDto,
  UpdateUserDto,
  UserDto
} from "./types.js";

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

  async addAdmin(grantorId: string, granteeId: string): Promise<true> {
    const isSuperAdmin = await this.#isSuperAdmin(grantorId);

    if (!isSuperAdmin) {
      throw new Error("User is not super administrator!");
    }

    const granteeExists = await this.#entryExists("user", granteeId);
    if (!granteeExists) {
      throw new Error("Cannot add inexistent user as administrator!");
    }
    await this.db.insertInto("admin").values({ id: granteeId }).execute();
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

  async removeUser(executorId: string, id: string): Promise<true> {
    const deleteUser = async (id: string) => {
      await this.db.deleteFrom("user").where("id", "=", id).execute();
    };

    if (executorId === id) {
      await deleteUser(id);
      return true;
    }
    const executorAdmin = await this.getAdmin(executorId);
    if (!executorAdmin) {
      throw new Error("Only administrators can delete accounts of other users!");
    }
    const isOtherUserAdmin = await this.#adminExists(id);
    if (isOtherUserAdmin && !executorAdmin.superAdmin) {
      throw new Error("Only super administrators can delete other administrators!");
    }

    await deleteUser(id);
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
    const targetAdminExists = await this.#adminExists(toBeRemovedId);

    if (!targetAdminExists) {
      throw new Error("Target admin does not exist!");
    }
    await this.db.deleteFrom("admin").where("id", "=", toBeRemovedId).execute();
    return true;
  }

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

  async #adminExists(adminId: string): Promise<boolean> {
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

  async #usersExist(): Promise<boolean> {
    const { userCount } = await this.db
      .selectFrom("user")
      .select((eb) => eb.fn.countAll().as("userCount"))
      .executeTakeFirstOrThrow();

    return BigInt(userCount) === 0n;
  }

  /* async getUserByUsername(username: string):Promise<UserDto> {
    await this.db.selectFrom("user").select
  } */
}
