import { Kysely } from "kysely";
import { DB } from "./db-types.js";
import { BaseTableColumns, CreateUserDto, UpdateAuthDto, UpdateUserDto, UserDto } from "./types.js";

export class DatabaseService {
  constructor(protected db: Kysely<DB>) {}

  async createUser({
    username,
    name,
    surname,
    email,
    avatar,
    hash,
    salt
  }: CreateUserDto): Promise<UserDto> {
    const user = await this.db.transaction().execute<UserDto | undefined>(async (trx) => {
      const newUser = await trx
        .insertInto("user")
        .values({ username, name, surname, email, avatar })
        .returningAll()
        .executeTakeFirstOrThrow();
      await trx.insertInto("auth").values({ id: newUser.id, hash, salt }).execute();
      return newUser;
    });
    if (!user) throw new Error("Error creating user");
    return user;
  }

  async updateUser(id: string, arg: UpdateUserDto): Promise<UserDto> {
    this.#forbidBaseColumns(arg);
    return await this.db
      .updateTable("user")
      .set({ ...arg, updatedAt: new Date() })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();
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

  #forbidBaseColumns<T extends Record<string, unknown>>(arg: T): void {
    const baseColumns: BaseTableColumns[] = ["createdAt", "id", "updatedAt"];
    if (baseColumns.some((col) => col in arg)) {
      throw new Error(`The following base columns are not allowed: ${baseColumns.join(", ")}.`);
    }
  }
  /* async getUserByUsername(username: string):Promise<UserDto> {
    await this.db.selectFrom("user").select
  } */
}
