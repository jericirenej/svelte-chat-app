import chalk from "chalk";
import { add } from "date-fns";

import { type Insertable, type Kysely, type Selectable, sql } from "kysely";
import { createLogger, format, transports } from "winston";
import { genPassword } from "../../../utils/generate-password.js";
import { baseDate, createEmail, createUserId, v5 } from "../../../utils/users.js";
import type { Admin, Auth, Chat, DB, Message, Participant, User } from "../db-types.js";
import type { XOR } from "../types.js";

const { timestamp, printf, align } = format;

const logForm = format.combine(
  timestamp({ format: "YYYY-MM-DD hh:mm:ss" }),
  align(),
  printf(
    ({ level, message, timestamp }) =>
      `${chalk.bold.green(`[SEED ${level}]`)} ${timestamp} ${chalk.yellow(message)}`
  )
);

const forceNull = <T>(value: T): NonNullable<T> | null => (!value ? null : value);
const isEven = (num: number): boolean => num % 2 === 0;
export const pickUser = <T>(num: number, user1: T, user2: T): T => (isEven(num) ? user1 : user2);

export type CreateUserArg = Partial<Pick<User, "id" | "avatar" | "surname" | "name">> & {
  username: string;
  createdAt?: Date | string;
  role?: "user" | "admin" | "superadmin";
};
type UserTemplate = {
  user: Insertable<Omit<User, "id">> & { id: string };
  auth: Insertable<Auth>;
  admin: Insertable<Admin> | null;
};
export type ChatSchema<T extends string> = {
  participants: T[];
  name?: string;
  createdAt?: Date | string;
  /** Optionally supply a `createdDate` or an `afterPrevious` property. If none supplied,
   * a base message interval will be used to queue the new message. */
  messages: Array<
    { username: T; message: string } & XOR<{
      createdAt?: Date | string;
      /** How many seconds after previous message the new one should be created */
      afterPrevious?: number;
    }>
  >;
};

type CreateMessageTemplateArg<T extends string> = {
  message: ChatSchema<T>["messages"][number];
  prevMessage: Insertable<Message> | undefined;
  index: number;
  chatId: string;
  chatDate: Date | string;
};

type ChatTemplate = {
  chat: Omit<Insertable<Chat>, "id"> & { id: string };
  messages: Omit<Insertable<Message>, "chatId">[];
  participants: Insertable<Participant>[];
};

export class SeederTemplateBuilder {
  baseDate = baseDate;
  baseMessageInterval = 120;
  baseChatInterval = 3.6e3 * 2;

  createUserTemplate(user: CreateUserArg): UserTemplate {
    const password = `${user.username}-password`,
      id = this.createUserId(user.username),
      createdAt = user.createdAt ?? this.baseDate;
    return {
      user: {
        id,
        email: createEmail(user.username),
        avatar: user.avatar ?? null,
        name: forceNull(user.name),
        surname: forceNull(user.surname),
        username: user.username,
        createdAt,
        updatedAt: createdAt
      },
      auth: { id, ...genPassword(password), createdAt },
      admin:
        !user.role || user.role === "user"
          ? null
          : { id, superAdmin: user.role === "superadmin", createdAt }
    };
  }

  protected createChatTemplate<T extends string>(
    { messages, participants, createdAt: createdDateArg, name }: ChatSchema<T>,
    chatIndex: number
  ): ChatTemplate {
    const id = v5("chat", chatIndex);
    this.minimumParticipants(participants);
    this.messageVerify(
      participants,
      messages.map(({ username }) => username)
    );

    const createdAt =
      createdDateArg ?? add(this.baseDate, { seconds: this.baseChatInterval * chatIndex });
    const dates = { createdAt, updatedAt: createdAt };

    const chat = { id, name: forceNull(name), ...dates };
    const chatParticipants: Insertable<Participant>[] = participants.map((username) => ({
      chatId: id,
      userId: this.createUserId(username),
      ...dates
    }));
    const messagesTemplate: Insertable<Message>[] = [];
    messages.forEach((message, index) => {
      messagesTemplate.push(
        this.createMessageTemplate({
          message,
          index,
          chatDate: createdAt,
          chatId: id,
          prevMessage: messagesTemplate[index - 1]
        })
      );
    });
    return { chat, participants: chatParticipants, messages: messagesTemplate };
  }
  createMessageTemplate<T extends string>({
    message,
    prevMessage,
    index,
    chatId,
    chatDate
  }: CreateMessageTemplateArg<T>): Omit<Selectable<Message>, "deleted"> {
    const id = v5("message", chatId, index);
    let createdAt: Date;
    const prevDate = prevMessage?.createdAt ?? chatDate;
    if (message.createdAt) {
      createdAt = new Date(message.createdAt);
    } else if (message.afterPrevious) {
      createdAt = add(prevDate, { seconds: message.afterPrevious });
    } else {
      createdAt = add(prevDate, { seconds: this.baseMessageInterval * index });
    }
    return {
      chatId,
      createdAt,
      updatedAt: createdAt,
      id,
      userId: this.createUserId(message.username),
      message: message.message
    };
  }

  protected minimumParticipants(participants: string[]): void {
    if (participants.length < 2) {
      throw new Error("A chat must have at least two participants");
    }
  }

  protected messageVerify(participantIds: string[], messageUsers: string[]): void {
    if (messageUsers.some((userId) => !participantIds.includes(userId))) {
      throw new Error("Message cannot be sent to users not in the chat");
    }
  }

  protected createUserId(username: string): string {
    return createUserId(username);
  }
}

export class Seeder extends SeederTemplateBuilder {
  private logger = createLogger({
    level: "info",
    transports: [new transports.Console()],
    format: logForm
  });

  constructor(
    private db: Kysely<DB>,
    private shouldLog = false
  ) {
    super();
  }

  async clearDb() {
    await this.db.transaction().execute(async (trx) => {
      await sql`DELETE FROM public.user;`.execute(trx);
      await sql`DELETE FROM public.chat;`.execute(trx);
    });
  }

  async createUsers(users: CreateUserArg[]): Promise<void> {
    for (const user of users) {
      await this.createUser(user);
    }
  }

  async createUser(user: CreateUserArg) {
    await this.saveUser(this.createUserTemplate(user));
  }

  async createChats<T extends string>(chatTemplates: ChatSchema<T>[]): Promise<void> {
    for (const [index, chat] of chatTemplates.entries()) {
      await this.createChat(chat, index);
    }
  }

  async createChat<T extends string>(chatTemplate: ChatSchema<T>, index = 0) {
    await this.saveChat(this.createChatTemplate(chatTemplate, index));
  }

  private async saveChat({ chat, messages, participants }: ChatTemplate): Promise<void> {
    try {
      await this.db.transaction().execute(async (trx) => {
        await trx.insertInto("chat").values(chat).returningAll().execute();
        await trx.insertInto("participant").values(participants).returningAll().execute();
        const completeMessages = messages.map(
          (message) => ({ ...message, chatId: chat.id }) satisfies Insertable<Message>
        );
        await trx.insertInto("message").values(completeMessages).returningAll().execute();
        this.logInfo(`Inserted chat details for chat ${chat.name ?? chat.id}`);
      });
    } catch (error) {
      this.logWarning(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Error while inserting chat details for chat ${chat.name ?? chat.id}: ${error}`
      );
    }
  }

  private async saveUser({ user, auth, admin }: UserTemplate): Promise<void> {
    try {
      await this.db.transaction().execute(async (trx) => {
        await trx.insertInto("user").values(user).returningAll().execute();
        await trx.insertInto("auth").values(auth).returningAll().execute();
        if (admin) {
          await trx.insertInto("admin").values(admin).returningAll().execute();
        }
      });
      this.logInfo(`User ${user.username} created successfully.`);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logWarning(`Error creating user ${user.username}: ${err}`);
    }
  }

  private log(message: string, level: "info" | "warn") {
    if (this.shouldLog) {
      this.logger[level](message);
    }
  }
  private logInfo(message: string): void {
    this.log(message, "info");
  }
  private logWarning(message: string): void {
    this.log(message, "warn");
  }
}
