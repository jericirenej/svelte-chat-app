/* eslint-disable @typescript-eslint/no-throw-literal */
import { error } from "@sveltejs/kit";
import { Kysely, sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import { db } from "./client.js";
import type { DB, User } from "./db-types.js";
import type {
  AdminDto,
  AuthDto,
  BaseTableColumns,
  ChatOrderProperties,
  CompleteUserDto,
  CreateChatDto,
  CreateMessageDto,
  CreateUserDto,
  GetChatDto,
  GetChatsDto,
  MessageDto,
  ParticipantDto,
  SingleUserSearch,
  UpdateAuthDto,
  UpdateUserDto,
  UserDto,
  UserRole
} from "./types.js";

type PrivilegeType = "user" | "admin" | "superAdmin";
type EntityCheckObj = {
  executorId: string;
  executorType?: PrivilegeType;
  targetId: string;
  targetType?: PrivilegeType;
};
/** Throw an HTTP error code that SvelteKit can catch */
const throwHttpError = (code: number, message: string) => {
  throw error(code, { message });
};
export class DatabaseService {
  readonly BASE_PREVIEW_LIMIT = 2;
  constructor(protected db: Kysely<DB>) {}

  /* ----- USER AND CREDENTIALS ----- */

  /** Create new user, along with their passed credentials. Initial user created as superadmin. */
  async addUser(createUserDto: CreateUserDto): Promise<CompleteUserDto> {
    if (!(await this.#usersExist())) {
      return await this.createSuperAdmin(createUserDto);
    }
    const user = await this.db.transaction().execute<UserDto | undefined>(async (trx) => {
      return await this.#createNewUserInserts(trx, createUserDto);
    });
    if (!user) return throwHttpError(500, "Error creating user");
    const role = await this.#getRole(user.id);
    return { ...user, role };
  }

  /** Search for user by their unique property. Full match required.
   * In addition to user details, also returns the admin status. */
  async getUser({ property, value }: SingleUserSearch): Promise<CompleteUserDto | undefined> {
    const user = await this.db
      .selectFrom("user")
      .selectAll()
      .where(property, "=", value)
      .executeTakeFirst();
    if (!user) return user;
    const role = await this.#getRole(user.id);
    return { ...user, role };
  }

  async usernameExists(username: string): Promise<boolean> {
    const user = await this.db
      .selectFrom("user")
      .select("username")
      .where("username", "=", username)
      .executeTakeFirst();
    return !!user;
  }

  async emailExists(email: string): Promise<boolean> {
    const user = await this.db
      .selectFrom("user")
      .select("email")
      .where("email", "=", email)
      .executeTakeFirst();
    return !!user;
  }

  async getCredentials(username: string): Promise<AuthDto | undefined> {
    const credentials = await this.db
      .selectFrom("auth")
      .innerJoin("user", "user.id", "auth.id")
      .selectAll("auth")
      .where("user.username", "=", username)
      .executeTakeFirst();
    return credentials;
  }

  async searchForUsers(search: string): Promise<CompleteUserDto[]> {
    const props = ["name", "surname", "username"] satisfies (keyof User)[];
    return await this.db
      .selectFrom("user")
      .leftJoin("admin", "admin.id", "user.id")
      .selectAll("user")
      .select((eb) =>
        eb
          .case()
          .when("admin.superAdmin", "is not", null)
          .then<"superAdmin">("superAdmin")
          .when("admin.id", "is not", null)
          .then<"admin">("admin")
          .else<"user">("user")
          .end()
          .as("role")
      )
      .where((eb) => eb.or(props.map((prop) => eb(eb.ref(`user.${prop}`), "ilike", `%${search}%`))))
      .execute();
  }

  /** Update user properties. Overriding id's is forbidden.*/
  async updateUser(id: string, arg: UpdateUserDto): Promise<CompleteUserDto> {
    this.#forbidBaseColumns(arg);
    const updated = await this.db
      .updateTable("user")
      .set({ ...arg, updatedAt: new Date() })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    if (!updated) {
      return throwHttpError(500, `Error while updating user with id: ${id}`);
    }
    const role = await this.#getRole(id);
    return { ...updated, role };
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

  async removeUser(executorId: string, targetId: string): Promise<true> {
    await this.canUserDeleteUser(executorId, targetId);
    await this.db.deleteFrom("user").where("id", "=", targetId).execute();
    return true;
  }

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

  /* ----- ADMINS ----- */

  /** Create initial superAdmin user, along with their passed credentials.
   * Can only be used if no users exist. */
  async createSuperAdmin(createUserArgs: CreateUserDto): Promise<CompleteUserDto> {
    // Safeguard against standalone calls
    const { adminCount } = await this.db
      .selectFrom("admin")
      .select((eb) => eb.fn.countAll().as("adminCount"))
      .where("superAdmin", "=", true)
      .executeTakeFirstOrThrow();

    if (BigInt(adminCount) !== 0n) {
      return throwHttpError(400, "Super administrator already exists!");
    }

    const user = await this.db.transaction().execute<CompleteUserDto | undefined>(async (trx) => {
      const newUser = await this.#createNewUserInserts(trx, createUserArgs);
      await trx.insertInto("admin").values({ id: newUser.id, superAdmin: true }).execute();
      return { ...newUser, role: "superAdmin" };
    });
    if (!user) {
      return throwHttpError(500, "Error creating user");
    }
    return user;
  }

  /** Add administrator to admin table */
  async addAdmin(executorId: string, targetId: string): Promise<true> {
    await this.#executorAndTargetCheck({ executorId, executorType: "superAdmin", targetId });

    await this.db.insertInto("admin").values({ id: targetId }).execute();
    return true;
  }

  /** Query administrator from table */
  async getAdmin(id: string): Promise<AdminDto | undefined> {
    return this.db.selectFrom("admin").selectAll().where("id", "=", id).executeTakeFirst();
  }

  /** Transfer super administrator status from one user to another. */
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

  async removeAdmin(executorId: string, toBeRemovedId: string): Promise<true> {
    const isSuperAdmin = await this.#isSuperAdmin(executorId);

    if (!isSuperAdmin) {
      return throwHttpError(404, "Super administrator does not exist!");
    }

    if (executorId === toBeRemovedId) {
      return throwHttpError(409, "Super administrators cannot remove themselves!");
    }
    const targetAdminExists = await this.#isAdmin(toBeRemovedId);

    if (!targetAdminExists) {
      return throwHttpError(404, "Target admin does not exist!");
    }
    await this.db.deleteFrom("admin").where("id", "=", toBeRemovedId).execute();
    return true;
  }

  /* ----- GUARDS ------ */
  // Assert user is authorized to delete users.
  async canUserDeleteUser(executorId: string, targetId: string): Promise<void> {
    if (executorId === targetId) {
      const isUserSuperAdmin = await this.#isSuperAdmin(executorId);
      if (isUserSuperAdmin) {
        return throwHttpError(
          400,
          "Super administrators cannot delete their own account without privilege transfer!"
        );
      }
      return;
    }
    const isUserAdmin = await this.getAdmin(executorId);
    if (!isUserAdmin) {
      return throwHttpError(403, "Only administrators can delete accounts of other users!");
    }
    const isOtherUserAdmin = await this.#isAdmin(targetId);
    if (isOtherUserAdmin && !isUserAdmin.superAdmin) {
      return throwHttpError(403, "Only super administrators can delete other administrators!");
    }
    return;
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
      return throwHttpError(
        403,
        "User does not exist or does not have permissions to perform the requested action!"
      );
    }

    const targetAllowed = await targetMethod(targetId);
    if (!targetAllowed) {
      return throwHttpError(
        403,
        "Target user does not exist or does not have the appropriate privilege type!"
      );
    }
  }

  /* ----- CHATS AND PARTICIPANTS ----- 
    Chats cannot be updated, only their participants can. 
    Normal users also cannot deleted them directly. They are removed, when
    the last of their participants is deleted as well. Only admins can delete
    chats directly. */
  async createChat({ name, participants }: CreateChatDto): Promise<GetChatDto> {
    const participantsExist = await Promise.all(participants.map((userId) => this.#isUser(userId)));
    if (!participantsExist.every((check) => check)) {
      return throwHttpError(400, "Not all participants exist as users!");
    }

    // When starting, a minimum of 2 participants required.
    // However, a chat can exist, until it has at least one participant.
    if (participants.length < 2) {
      return throwHttpError(400, "At least two participants are required when creating a chat!");
    }
    // Need explicit setting, or insert will throw.
    const nameVal = name ? name : null;
    const chat = await this.db.transaction().execute(async (trx) => {
      const createdChat = await trx
        .insertInto("chat")
        .values({ name: nameVal })
        .returningAll()
        .executeTakeFirst();
      if (!createdChat) {
        return throwHttpError(500, "Error creating new chat!");
      }

      const participantIds = await trx
        .insertInto("participant")
        .values(participants.map((id) => ({ chatId: createdChat.id, userId: id })))
        .returning("participant.userId")
        .execute();

      return {
        ...createdChat,
        participants: participantIds.map(({ userId }) => userId),
        messages: []
      };
    });
    return chat;
  }

  /** Get a chat by their id */
  async getChat(chatId: string): Promise<GetChatDto | undefined> {
    const chat = await this.baseGetChatQuery().where("c.id", "=", chatId).executeTakeFirst();

    if (!chat) return chat;
    return {
      ...chat,
      participants: chat.participants.map(({ userId }) => userId)
    };
  }

  async getChats({ chatIds, direction, property }: GetChatsDto): Promise<GetChatDto[]> {
    if (!chatIds || !chatIds.length) {
      return throwHttpError(400, "At least one chat id must be supplied!");
    }
    const ids = Array.isArray(chatIds) ? chatIds : [chatIds];
    const query = this.baseGetChatQuery().where("c.id", "in", ids);
    const chats = await this.#chatOrderByQuery(query, { direction, property }).execute();
    return chats.map((chat) => ({
      ...chat,
      participants: chat.participants.map(({ userId }) => userId)
    }));
  }

  async getChatIdsForUser(userId: string): Promise<string[]> {
    const chatIds = await this.db
      .selectFrom("participant")
      .select("chatId")
      .where("userId", "=", userId)
      .execute();

    return chatIds.map(({ chatId }) => chatId);
  }

  async getChatsForUser(
    userId: string,
    orderBy: Partial<ChatOrderProperties> = {}
  ): Promise<GetChatDto[]> {
    const chatIds = await this.getChatIdsForUser(userId);
    if (!chatIds.length) return [];

    return await this.getChats({ chatIds, ...orderBy });
  }

  private baseGetChatQuery() {
    return this.db
      .selectFrom("chat as c")
      .selectAll("c")
      .select((eb) => [
        jsonArrayFrom(
          eb.selectFrom("participant as p").select("p.userId").whereRef("p.chatId", "=", "c.id")
        ).as("participants"),
        jsonArrayFrom(
          eb
            .selectFrom("message as m")
            .selectAll()
            .whereRef("m.chatId", "=", "c.id")
            .limit(this.BASE_PREVIEW_LIMIT)
        ).as("messages")
      ]);
  }

  #chatOrderByQuery(
    query: ReturnType<typeof this.baseGetChatQuery>,
    orderObj: Partial<ChatOrderProperties>
  ) {
    const directionArr = ["desc", "asc"] satisfies ChatOrderProperties["direction"][];
    const property = orderObj.property ?? "createdAt";
    // Ensure value complies with allowed input
    const ordering = directionArr.find((dir) => orderObj.direction === dir) ?? "desc";

    if (property === "createdAt" || property === "name") {
      return query.orderBy(`c.${property}`, sql.raw(`${ordering} NULLS LAST`));
    }
    if (property === "participants") {
      return query.orderBy(
        (eb) =>
          eb
            .selectFrom("participant as p2")
            .select((eb) => eb.fn.countAll().as("pCount"))
            .whereRef("p2.chatId", "=", "c.id"),
        ordering
      );
    }

    return query.orderBy(
      (eb) =>
        eb
          .selectFrom("message as m2")
          .select((eb) => eb.fn.countAll().as("mCount"))
          .whereRef("m2.chatId", "=", "c.id"),
      ordering
    );
  }

  async deleteChats(adminId: string, chatIds: string | string[]): Promise<boolean> {
    const ids = Array.isArray(chatIds) ? chatIds : [chatIds];
    if (!ids.length) {
      return throwHttpError(400, "Chat ids must be supplied!");
    }
    const isAdmin = await this.#isAdmin(adminId);
    if (!isAdmin) {
      return throwHttpError(403, "Only administrators can delete chats directly!");
    }
    const chatsExist = await this.#entriesExist("chat", ids);
    if (!chatsExist) {
      return throwHttpError(
        404,
        ids.length === 1 ? "Target chat does not exist!" : "Some or all target chats do not exist!"
      );
    }
    await this.db.deleteFrom("chat").where("id", "in", ids).execute();
    return true;
  }

  async getParticipantsForChat(chatId: string): Promise<UserDto[]> {
    await this.#throwIfNotFound("chat", chatId, "Chat does not exist!");
    return await this.db
      .selectFrom("user as u")
      .selectAll(["u"])
      .innerJoin("participant as p", "p.userId", "u.id")
      .where("p.chatId", "=", chatId)
      .execute();
  }

  async addParticipantToChat(chatId: string, userId: string): Promise<ParticipantDto> {
    const checks = await Promise.all([this.#entryExists("chat", chatId), this.#isUser(userId)]);
    if (!checks.every((check) => check)) {
      return throwHttpError(404, "Chat or user do not exist");
    }
    const participant = await this.db
      .insertInto("participant")
      .values({ chatId, userId })
      .returningAll()
      .executeTakeFirst();
    if (!participant) {
      return throwHttpError(500, "Error while adding participant to chat!");
    }
    return participant;
  }

  async removeParticipantFromChat(chatId: string, userId: string): Promise<boolean> {
    await this.#throwIfNotFound("chat", chatId, "Chat does now exist!");

    const participantsQuery = await this.db
      .selectFrom("participant")
      .select("userId")
      .where("chatId", "=", chatId)
      .execute();

    const participants = participantsQuery.map(({ userId }) => userId);
    if (!participants.find((id) => id === userId)) {
      return throwHttpError(400, "User is not a participant of the target chat!");
    }
    // If only a single participant is left in chat, remove the
    // chat itself which will remove the participant as well.
    if (participants.length === 1) {
      await this.db.deleteFrom("chat").where("id", "=", chatId).execute();
    } else {
      await this.db.deleteFrom("participant").where("userId", "=", userId).execute();
    }
    return true;
  }

  /* ----- MESSAGES ----- */

  /* Currently  no updating (editing) of messages. Allow for soft deletions. */

  /** Create a message in the existing chat.
   * If autoAdd is true, users that are not participants of the current chat
   * will be auto-added. Defaults to `false` */
  async createMessage(
    { chatId, message, userId }: CreateMessageDto,
    autoAdd = false
  ): Promise<MessageDto> {
    const isParticipant = await this.#isParticipant(chatId, userId);
    if (!autoAdd && !isParticipant) {
      return throwHttpError(400, "User is not participant of the target chat!");
    }
    if (autoAdd && !isParticipant) {
      await this.addParticipantToChat(chatId, userId);
    }
    const createdMessage = await this.db
      .insertInto("message")
      .values({ chatId, message, userId })
      .returningAll()
      .executeTakeFirst();
    if (!createdMessage) {
      return throwHttpError(500, "Error creating new chat message!");
    }
    return createdMessage;
  }

  async getMessagesForChat(
    chatId: string,
    options: { take?: number; skip?: number; direction?: "desc" | "asc" } = {}
  ): Promise<MessageDto[]> {
    if (!chatId) return [];
    await this.#throwIfNotFound("chat", chatId, "Target chat does not exist!");
    let baseQuery = this.db
      .selectFrom("message")
      .selectAll()
      .where("chatId", "=", chatId)
      .orderBy("createdAt", options.direction ?? "desc");

    if (options.take) {
      baseQuery = baseQuery.offset(options.skip ?? 0).limit(options.take);
    }
    return await baseQuery.execute();
  }

  /** Message authors can toggle their message deletion status */
  async toggleMessageDelete(userId: string, messageId: string): Promise<MessageDto> {
    const messageExists = await this.db
      .selectFrom("message")
      .select(["id", "deleted"])
      .where("userId", "=", userId)
      .executeTakeFirst();
    if (!messageExists) {
      return throwHttpError(403, "User is not the author of target message!");
    }

    const message = await this.db
      .updateTable("message")
      .set({ deleted: !messageExists.deleted })
      .where("id", "=", messageId)
      .returningAll()
      .executeTakeFirst();
    if (!message) {
      return throwHttpError(500, "Error toggling delete status of message!");
    }

    return message;
  }

  /* ----- UTILITY METHODS ----- */

  /** Prevent external modification of base table columns, such as `id`, `createdDate`, `updatedDate` */
  #forbidBaseColumns<T extends Record<string, unknown>>(arg: T): void {
    const baseColumns: BaseTableColumns[] = ["createdAt", "id", "updatedAt"];
    if (baseColumns.some((col) => col in arg)) {
      return throwHttpError(
        400,
        `The following base columns are not allowed: ${baseColumns.join(", ")}.`
      );
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

  async #throwIfNotFound(
    table: keyof DB,
    id: string | string[],
    errMessage?: string
  ): Promise<void> {
    const exists = Array.isArray(id)
      ? await this.#entriesExist(table, id)
      : await this.#entryExists(table, id);
    if (exists) return;
    return throwHttpError(404, errMessage ?? "Entry does not exist!");
  }

  async #entriesExist(table: keyof DB, ids: string[]): Promise<boolean> {
    const entries = await this.db
      .selectFrom(table)
      .select("id")
      .where(`${table}.id`, "in", ids)
      .execute();
    return entries.length === ids.length;
  }

  async #getRole(userId: string): Promise<UserRole> {
    const adminEntry = await this.db
      .selectFrom("admin")
      .selectAll()
      .where("id", "=", userId)
      .executeTakeFirst();
    if (!adminEntry) return "user";
    if (adminEntry.superAdmin) return "superAdmin";
    return "admin";
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

  async #isParticipant(chatId: string, userId: string): Promise<boolean> {
    const chat = await this.getChat(chatId);
    if (!chat) {
      return throwHttpError(404, "Target chat does not exist!");
    }
    return chat.participants.includes(userId);
  }

  async #usersExist(): Promise<boolean> {
    const { userCount } = await this.db
      .selectFrom("user")
      .select((eb) => eb.fn.countAll().as("userCount"))
      .executeTakeFirstOrThrow();

    return BigInt(userCount) !== 0n;
  }
}

export const dbService = new DatabaseService(db);
