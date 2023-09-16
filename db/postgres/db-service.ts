import { Kysely } from "kysely";
import { DB } from "./db-types.js";
import { BaseTableColumns, CreateUserDto, UpdateAuthDto, UpdateUserDto, UserDto } from "./types.js";

export class DatabaseService {
  constructor(protected db: Kysely<DB>) {}

  // GET ENTITIES

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

  /** Create new user, along with their passed credentials. */
  async createUser(createUserDto: CreateUserDto): Promise<UserDto> {
    const user = await this.db.transaction().execute<UserDto | undefined>(async (trx) => {
      return await this.#createNewUserInserts(trx, createUserDto);
    });
    if (!user) throw new Error("Error creating user");
    return user;
  }

  /** Create initial admin user, along with their passed credentials.
   * Can only be used if no admin user exists */
  async createAdminUser(createUserArgs: CreateUserDto): Promise<UserDto> {
    const { adminCount } = await this.db
      .selectFrom("admin")
      .select((eb) => eb.fn.countAll().as("adminCount"))
      .executeTakeFirstOrThrow();

    if (BigInt(adminCount) !== 0n) {
      throw new Error("User with admin privileges has already been created!");
    }

    const user = await this.db.transaction().execute<UserDto | undefined>(async (trx) => {
      const newUser = await this.#createNewUserInserts(trx, createUserArgs);
      await trx.insertInto("admin").values({ id: newUser.id }).execute();
      return newUser;
    });
    if (!user) throw new Error("Error creating user");
    return user;
  }

  async addAdmin(grantorId: string, granteeId: string): Promise<true> {
    const grantorExists = await this.#entryExists("user", grantorId);
    const isGrantorAdmin = await this.#entryExists("admin", grantorId);

    if (!grantorExists || !isGrantorAdmin) {
      throw new Error("Grantor does not exist or is not an administrator!");
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

  /* async getUserByUsername(username: string):Promise<UserDto> {
    await this.db.selectFrom("user").select
  } */
}
