import chalk from "chalk";
import { add } from "date-fns";
import { Insertable, Transaction, sql } from "kysely";
import { v5 as uuid5 } from "uuid";
import { genPassword } from "../../../utils/generate-password.js";
import { db } from "../client.js";
import { Admin, Auth, Chat, DB, Message, Participant, User } from "../db-types.js";
import { BaseDateColumns } from "../types.js";
import MESSAGES from "./seed.messages.js";
const BASE_UUID = "feec01c4-3e1a-4cde-9160-f114461d700e";

type BaseCredentials = Omit<Auth, BaseDateColumns>;

const createEmail = (username: string): string => `${username}@nowhere.never`;

const v5 = (...args: (string | number)[]): string => uuid5(args.join("-"), BASE_UUID);

const baseCreate = new Date(2023, 0, 1, 12);

const USERS = [
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
const userPicker = USERS.reduce(
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
    participants: [userPicker.lovelace, userPicker.the_turing],
    name: "A conversation between admins",
    createdAt: add(baseCreate, { days: 1 }),
    messages: [
      {
        userId: userPicker.lovelace,
        message: MESSAGES[0],
        createdAt: add(baseCreate, { days: 1, seconds: 1 })
      },
      {
        userId: userPicker.the_turing,
        message: MESSAGES[1],
        createdAt: add(baseCreate, { days: 1, minutes: 1 })
      },
      {
        userId: userPicker.the_turing,
        message: MESSAGES[2],
        createdAt: add(baseCreate, { days: 1, minutes: 1, seconds: 10 })
      },
      {
        userId: userPicker.lovelace,
        message: MESSAGES[3],
        createdAt: add(baseCreate, { days: 1, minutes: 2 })
      }
    ]
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
  console.log(chalk.green.bold("[SEED]"), chalk.yellow("Inserting users."));
  await trx.insertInto("user").values(userData).execute();
  console.log(chalk.green.bold("[SEED]"), chalk.yellow("Inserting auth data."));
  await trx.insertInto("auth").values(authData).execute();
  console.log(chalk.green.bold("[SEED]"), chalk.yellow("Inserting admin data."));
  await trx.insertInto("admin").values(adminData).execute();
};

const populateChats = async (trx: Transaction<DB>): Promise<void> => {
  const chatData: Insertable<Chat>[] = [],
    participantData: Insertable<Participant>[] = [],
    messageData: Insertable<Message>[] = [];
  CHATS.forEach(({ createdAt, name, participants, messages }, index) => {
    const dates = { createdAt, updatedAt: createdAt };
    const chatId = v5("chat", index);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
  console.log(chalk.green.bold("[SEED]"), chalk.yellow("Inserting chats."));
  await trx.insertInto("chat").values(chatData).execute();
  console.log(chalk.green.bold("[SEED]"), chalk.yellow("Inserting participants."));
  await trx.insertInto("participant").values(participantData).execute();
  console.log(chalk.green.bold("[SEED]"), chalk.yellow("Inserting messages."));
  await trx.insertInto("message").values(messageData).execute();
};

const seed = async (): Promise<void> => {
  await db.transaction().execute(async (trx) => {
    console.log(chalk.green.bold("[SEED]"), chalk.yellow("Clearing db."));
    await sql`DELETE FROM public.user;`.execute(trx);
    await sql`DELETE FROM public.chat;`.execute(trx);
    await populateUsers(trx);
    await populateChats(trx);
  });
  await db.destroy();
};

await seed();
