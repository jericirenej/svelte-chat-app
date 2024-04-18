import chalk from "chalk";
import { add } from "date-fns";
import { Insertable, Transaction, sql } from "kysely";
import { v5 as uuid5 } from "uuid";
import { createLogger, format, transports } from "winston";
import { genPassword } from "../../../utils/generate-password.js";
import { db } from "../client.js";
import { Admin, Auth, Chat, DB, Message, Participant, User } from "../db-types.js";
import { BaseDateColumns } from "../types.js";
import MESSAGES from "./seed.messages.js";
const BASE_UUID = "feec01c4-3e1a-4cde-9160-f114461d700e";

type BaseCredentials = Omit<Auth, BaseDateColumns>;

const formattedTime = (time: number): string =>
  time >= 1000 ? `${(time / 1000).toFixed(2)} seconds` : `${time.toFixed(2)} miliseconds`;

const { timestamp, printf, align } = format;

const logForm = format.combine(
  timestamp({ format: "YYYY-MM-DD hh:mm:ss" }),
  align(),
  printf(
    ({ level, message, timestamp }) =>
      `${chalk.bold.green(`[SEED ${level}]`)} ${timestamp} ${chalk.yellow(message)}`
  )
);

const logger = createLogger({
  level: "info",
  transports: [new transports.Console()],
  format: logForm
});

const logInfo = (message: string):void => {
  if(process.env["NO_LOG"] === "true") return;
  logger.log("info", message);

}

const createEmail = (username: string): string => `${username}@nowhere.never`;

const isEven = (num: number): boolean => num % 2 === 0;
const pickUser = (num: number, user1: string, user2: string): string =>
  isEven(num) ? user1 : user2;

const v5 = (...args: (string | number)[]): string => uuid5(args.join("-"), BASE_UUID);

const baseCreate = new Date(2023, 0, 1, 12);

export const USERS = [
  {
    username: "babbage" as const,
    name: "Charles",
    surname: "Babbage",
    email: createEmail("babbage15")
  },
  {
    username: "lovelace" as const,
    name: "Ada",
    surname: "Lovelace",
    email: createEmail("lovelace"),
    admin: "superadmin" as const
  },
  {
    username: "liskov" as const,
    name: "Barbara",
    surname: "Liskov",
    email: createEmail("no_substitute")
  },
  {
    username: "chu_lonzo" as const,
    name: "Alonzo",
    surname: "Church",
    email: createEmail("chu_lonzo")
  },
  {
    username: "the_turing" as const,
    name: "Alan",
    surname: "Turing",
    email: createEmail("turing_machine"),
    admin: "admin" as const
  },
  {
    username: "russel_guy" as const,
    name: "Bertrand",
    surname: "Russel",
    email: createEmail("i_am_whole")
  },
  {
    username: "incomplete_guy" as const,
    name: "Kurt",
    surname: "Gödel",
    email: createEmail("kgodel")
  },
  {
    username: "logician" as const,
    name: "George",
    surname: "Bool",
    email: createEmail("gbool")
  }
].map((user) => {
  const password = `${user.username}-password`;
  const { hash, salt } = genPassword(password);
  const id = v5("user", user.username);
  return {
    ...user,
    createdAt: baseCreate,
    auth: { hash, salt, id },
    id
  };
}) satisfies (Insertable<User> & { auth: BaseCredentials } & { admin?: "admin" | "superadmin" })[];

export type AvailableUsers = (typeof USERS)[number]["username"];
const users = USERS.reduce(
  (hashMap, { username, id }) => {
    hashMap[username] = id;
    return hashMap;
  },
  {} as Record<AvailableUsers, string>
);

type MessageSchema = {
  userId: string;
  message: string;
  createdAt: Date;
};
type ChatSchema = {
  participants: string[];
  name?: string;
  messages: MessageSchema[];
  createdAt: Date;
};

const CHATS = [
  {
    participants: [users.lovelace, users.the_turing],
    name: "A conversation between admins",
    createdAt: add(baseCreate, { days: 1, minutes: 1 }),
    messages: new Array(4).fill(0).map((_, i) => ({
      userId: pickUser(i, users.lovelace, users.the_turing),
      message: MESSAGES[0 + i],
      createdAt: add(baseCreate, { days: 1, minutes: i + 1 })
    }))
  },
  {
    participants: [users.incomplete_guy, users.chu_lonzo],
    createdAt: add(baseCreate, { days: 1, hours: 1, minutes: 0 }),
    messages: new Array(8).fill(0).map((_, i) => ({
      userId: pickUser(i, users.incomplete_guy, users.chu_lonzo),
      message: MESSAGES[5 + i] ?? MESSAGES[0 + 1],
      createdAt: add(baseCreate, { days: 1, hours: 1, minutes: 0, seconds: 0 + 10 * i })
    }))
  },
  {
    participants: [users.lovelace, users.liskov],
    name: "A conversation between admins",
    createdAt: add(baseCreate, { days: 1, minutes: 6 }),
    messages: new Array(4).fill(0).map((_, i) => ({
      userId: pickUser(i, users.lovelace, users.liskov),
      message: MESSAGES[13 + i] ?? MESSAGES[0 + i],
      createdAt: add(baseCreate, { days: 1, minutes: i + 6, seconds: 0 + i })
    }))
  }
] satisfies ChatSchema[];

const populateUsers = async (trx: Transaction<DB>): Promise<void> => {
  const userData: Insertable<User>[] = USERS.map(
    ({ createdAt, id, name, surname, username, email }) => ({
      createdAt,
      id,
      name,
      surname,
      username,
      email,
      updatedAt: createdAt
    })
  );
  const authData: Insertable<Auth>[] = USERS.map(({ createdAt, id, auth }) => ({
    id,
    createdAt,
    updatedAt: createdAt,
    hash: auth.hash,
    salt: auth.salt
  }));
  const adminData: Insertable<Admin>[] = USERS.filter(({ admin }) => admin).map(
    ({ id, createdAt, admin }) => ({
      id,
      createdAt,
      updatedAt: createdAt,
      superAdmin: admin === "superadmin"
    })
  );
  logInfo("Inserting users");
  await trx.insertInto("user").values(userData).execute();
  logInfo("Inserting auth data");
  await trx.insertInto("auth").values(authData).execute();
  logInfo("Inserting admin data");
  await trx.insertInto("admin").values(adminData).execute();
};

const populateChats = async (trx: Transaction<DB>): Promise<void> => {
  const chatData: Insertable<Chat>[] = [],
    participantData: Insertable<Participant>[] = [],
    messageData: Insertable<Message>[] = [];
  CHATS.forEach(({ createdAt, name, participants, messages }, index) => {
    const dates = { createdAt, updatedAt: createdAt };
    const chatId = v5("chat", index);
    chatData.push({ id: chatId, name: name ?? null, ...dates });
    participantData.push(
      ...participants.map((userId) => ({
        id: v5(chatId, "participant", userId),
        chatId,
        userId,
        ...dates
      }))
    );
    messageData.push(
      ...messages.map(({ createdAt, message, userId }, index) => {
        const dates = { createdAt, updatedAt: createdAt };
        return {
          chatId,
          message,
          userId,
          id: v5(chatId, "message", index),
          deleted: false,
          ...dates
        };
      })
    );
  });
  logInfo("Inserting chats");
  await trx.insertInto("chat").values(chatData).execute();
  logInfo("Inserting participants");
  await trx.insertInto("participant").values(participantData).execute();
  logInfo("Inserting messages");
  await trx.insertInto("message").values(messageData).execute();
};

export const seed = async (database = db): Promise<void> => {
  await database.transaction().execute(async (trx) => {
    const begin = performance.now();
    logInfo("Starting seed");
    logInfo("Clearing database");
    await sql`DELETE FROM public.user;`.execute(trx);
    await sql`DELETE FROM public.chat;`.execute(trx);
    await populateUsers(trx);
    await populateChats(trx);
    const formatted = formattedTime(performance.now() - begin);
    logInfo(`Seed completed in ${formatted}. Exiting.`);
  });
  await database.destroy();
  process.exit(0);
};
