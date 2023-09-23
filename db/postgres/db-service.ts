import { Kysely, sql } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import { DB, User } from "./db-types.js";
import {
  AdminDto,
  BaseTableColumns,
  ChatOrderProperties,
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
  readonly BASE_PREVIEW_LIMIT = 2;
  constructor(protected db: Kysely<DB>) {}

  /* ----- USER AND CREDENTIALS ----- */

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

  /** Create new user, along with their passed credentials. Initial user created as superadmin. */
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
    return await this.db
      .selectFrom("user")
      .selectAll()
      .where((eb) => eb.or(props.map((prop) => eb(eb.ref(prop), "ilike", `%${search}%`))))
      .execute();
  }

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

  /* ----- GUARDS ------ */
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

  /* ----- CHATS AND PARTICIPANTS ----- 
    Chats cannot be updated, only their participants can. They are also only deleted when last
    their participants is deleted as well. */
  async createChat({ name, participants }: CreateChatDto): Promise<GetChatDto> {
    const participantsExist = await Promise.all(participants.map((userId) => this.#isUser(userId)));
    if (!participantsExist.every((check) => check)) {
      throw new Error("Not all participants exist as users!");
    }

    // When starting, a minimum of 2 participants required.
    // However, a chat can exist, until it has at least one participant.
    if (participants.length < 2) {
      throw new Error("At least two participants are required when creating a chat!");
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
        throw new Error("Error creating new chat!");
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
      throw new Error("At least one chat id must be supplied!");
    }
    const ids = Array.isArray(chatIds) ? chatIds : [chatIds];
    const query = this.baseGetChatQuery().where("c.id", "in", ids);
    const chats = await this.#chatOrderByQuery(query, { direction, property }).execute();
    return chats.map((chat) => ({
      ...chat,
      participants: chat.participants.map(({ userId }) => userId)
    }));
  }

  async getChatsForUser(
    userId: string,
    orderBy: Partial<ChatOrderProperties> = {}
  ): Promise<GetChatDto[]> {
    const chatIdsQuery = await this.db
      .selectFrom("participant")
      .select("chatId")
      .where("userId", "=", userId)
      .execute();
    if (!chatIdsQuery.length) return [];

    return await this.getChats({ chatIds: chatIdsQuery.map(({ chatId }) => chatId), ...orderBy });
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

  async addParticipantToChat(chatId: string, userId: string): Promise<ParticipantDto> {
    const checks = await Promise.all([this.#entryExists("chat", chatId), this.#isUser(userId)]);
    if (!checks.every((check) => check)) {
      throw new Error("Chat or user do not exist");
    }
    const participant = await this.db
      .insertInto("participant")
      .values({ chatId, userId })
      .returningAll()
      .executeTakeFirst();
    if (!participant) {
      throw new Error("Error while adding participant to chat!");
    }
    return participant;
  }

  async removeParticipantFromChat(chatId: string, userId: string): Promise<boolean> {
    await this.#entryExists("chat", chatId);
    const participantsQuery = await this.db
      .selectFrom("participant")
      .select("userId")
      .where("chatId", "=", chatId)
      .execute();

    const participants = participantsQuery.map(({ userId }) => userId);
    if (!participants.find((id) => id === userId)) {
      throw new Error("User is not a participant of the target chat!");
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
  /** Create a message in the existing chat.
   * If autoAdd is true, users that are not participants of the current chat
   * will be auto-added. Defaults to `false` */
  async createMessage(
    { chatId, message, userId }: CreateMessageDto,
    autoAdd = false
  ): Promise<MessageDto> {
    const isParticipant = await this.#isParticipant(chatId, userId);
    if (!autoAdd && !isParticipant) {
      throw new Error("User is not participant of the target chat!");
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
      throw new Error("Error creating new chat message!");
    }
    return createdMessage;
  }

  /* ----- UTILITY METHODS ----- */

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

  async #isParticipant(chatId: string, userId: string): Promise<boolean> {
    const chat = await this.getChat(chatId);
    if (!chat) {
      throw new Error("Target chat does not exist!");
    }
    return chat.participants.includes(userId);
  }

  async #usersExist(): Promise<boolean> {
    const { userCount } = await this.db
      .selectFrom("user")
      .select((eb) => eb.fn.countAll().as("userCount"))
      .executeTakeFirstOrThrow();

    return BigInt(userCount) === 0n;
  }
}
