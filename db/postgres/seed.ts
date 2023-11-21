import { faker } from "@faker-js/faker";
import chalk from "chalk";
import { add } from "date-fns";
import { Insertable, Kysely, Selectable, sql } from "kysely";
import { genPassword } from "../../utils/generate-password.js";
import { db } from "./client.js";
import type { Auth, Chat, DB, Message, Participant, User } from "./db-types.js";
import { randomPick } from "./tools/utils.js";
import type { BaseDateColumns, BaseTableColumns } from "./types.js";

type BaseUser = Omit<User, BaseTableColumns>;
type BaseCredentials = Omit<Auth, BaseDateColumns>;
type BaseChat = Omit<Chat, BaseTableColumns> & Record<BaseDateColumns, Date>;
type ChatSelect = Selectable<Chat>;
type BaseParticipant = Omit<Participant, BaseTableColumns>;
type BaseMessage = Omit<Insertable<Message>, "id">;

/** See https://stackoverflow.com/a/2450976/7249085 for original implementation */
const randomizeArray = <T>(arr: T[]): T[] => {
  const randomized = [...arr];
  let currentIndex = randomized.length,
    randomIndex: number;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [randomized[currentIndex], randomized[randomIndex]] = [
      randomized[randomIndex],
      randomized[currentIndex]
    ];
  }
  return randomized;
};

const randomSliceArray = <T>(arr: T[], minMembers = 3): T[] => {
  const lowerLimit = minMembers <= arr.length ? minMembers : arr.length;
  return randomizeArray(arr).slice(
    0,
    Math.floor(Math.random() * arr.length - lowerLimit) + lowerLimit
  );
};

// USER GENERATION
const createUser = (): BaseUser => {
  const name = faker.person.firstName(),
    surname = faker.person.lastName();

  const username = faker.internet.userName({ firstName: name, lastName: surname }).toLowerCase(),
    email = faker.internet.email({ firstName: name, lastName: surname }),
    avatar = faker.image.avatarGitHub();

  return { name, surname, username, email, avatar };
};

const generateCredentials = ({
  id,
  username
}: {
  id: string;
  username: string;
}): BaseCredentials => {
  const { hash, salt } = genPassword(`${username}-password`);
  return { id, hash, salt };
};

/* const generateContacts = (
  userId: string,
  existingUsers: string[],
  randomize = true,
  limit = 8
): BaseContact[] => {
  const others = existingUsers.filter((id) => id !== userId);
  const maxContacts = limit <= others.length ? limit : others.length;
  if (!randomize) return others.map((contactId) => ({ userId, contactId }));

  const numberOfContacts = new Array(Math.floor(Math.random() * maxContacts) + 1).fill(0);
  let userPool = [...others];
  const contacts: BaseContact[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const _ of numberOfContacts) {
    const contactId = userPool[Math.floor(Math.random() * userPool.length)];
    userPool = userPool.filter((id) => id !== contactId);
    contacts.push({ contactId, userId });
  }
  return contacts;
};
 */
/** Return confirmed contacts of a user, suitable for participating in the same chat.
 * Confirmed users are those contacts of a user that have their user among their own contacts as well. */
/* const eligibleParticipants = async (userId: string, db: Kysely<DB>): Promise<string[]> => {
  const confirmedContacts = await db
    .selectFrom("contact as c")
    .select("c.contactId")
    .where((eb) =>
      eb(
        "c.userId",
        "in",
        eb
          .selectFrom("contact as c2")
          .select("c2.contactId")
          .whereRef("c2.userId", "=", "c.contactId")
      )
    )
    .execute();
  return [userId, ...confirmedContacts.map(({ contactId }) => contactId)];
}; */

const createParticipants = (participants: string[], chatId: string): BaseParticipant[] => {
  return participants.map((userId) => ({ chatId, userId }));
};

const createMessages = (
  participants: string[],
  { id, createdAt }: ChatSelect,
  numberOfMessages?: number
): BaseMessage[] => {
  const MAX_MESSAGE = 10,
    MIN_MESSAGE = 3;
  const determinedNumber =
    numberOfMessages ?? Math.floor(Math.random() * MAX_MESSAGE - MIN_MESSAGE + MIN_MESSAGE);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return new Array(determinedNumber).fill(0).map((_, index) => {
    const userId = randomPick(participants);
    const message = randomPick([faker.hacker.phrase(), faker.hacker.ingverb()]);

    const creationDate = add(createdAt, {
      seconds: Math.floor(Math.random() * 10 + 5)
    });
    return {
      chatId: id,
      createdAt: creationDate,
      updatedAt: creationDate,
      message,
      userId,
      deleted: false
    };
  });
};

// Create random number of chats for users
const createChats = async (
  userIds: string[],
  earliestDate = new Date(),
  db: Kysely<DB>,
  limit = 3
): Promise<Map<string, ChatSelect[]>> => {
  let total = 0;
  const chatsPerUser: [string, number][] = userIds.map((user) => {
    const num = Math.floor(Math.random() * limit + 1);
    total += num;
    return [user, num];
  });
  const baseChats: BaseChat[] = new Array(total).fill(0).map(() => {
    const date = faker.date.recent({ days: 10, refDate: earliestDate });
    return {
      name: faker.word.words({ count: { min: 1, max: 4 } }),
      createdAt: date,
      updatedAt: date
    };
  });

  const chats = await db.insertInto("chat").values(baseChats).returningAll().execute();

  return new Map<string, ChatSelect[]>(
    chatsPerUser.map(([user, num]) => [user, chats.splice(0, num)])
  );
};

const userGenerator = async (numberOfUsers: number, db: Kysely<DB>): Promise<void> => {
  // Ensure unique usernames and emails
  const userNames = new Set<string>(),
    emails = new Set<string>(),
    uniqueUsers: BaseUser[] = [];
  let count = 1;
  while (count <= numberOfUsers) {
    const user = createUser();
    const { username, email } = user;
    if (userNames.has(username) || emails.has(email)) {
      continue;
    }
    userNames.add(username);
    emails.add(email);
    uniqueUsers.push(user);
    count++;
  }

  const createdUsers = await db
    .insertInto("user")
    .values(uniqueUsers)
    .returning(["id", "username"])
    .execute();

  const baseCredentials = createdUsers.map((u) => generateCredentials(u));
  await db.insertInto("auth").values(baseCredentials).execute();

  const adminId = randomPick(createdUsers).id;
  await db.insertInto("admin").values({ id: adminId, superAdmin: true }).execute();

  const allUserIds = createdUsers.map(({ id }) => id);

  // Create chats
  const usersThatShouldHaveChats = randomSliceArray(allUserIds);
  const userChatMap = await createChats(usersThatShouldHaveChats, new Date("2023-09-11"), db);
  const participants: BaseParticipant[] = [];
  const messages: BaseMessage[] = [];

  for (const userId of [...userChatMap.keys()]) {
    const randomParticipants = randomSliceArray(allUserIds, 2);
    const finalParticipants = [...new Set([...randomParticipants, userId])];
    const targetChats = userChatMap.get(userId);
    if (!targetChats) continue;
    targetChats.forEach((chat) => {
      participants.push(...createParticipants(finalParticipants, chat.id)),
        messages.push(...createMessages(finalParticipants, chat));
    });
  }

  await db.insertInto("participant").values(participants).execute();
  await db.insertInto("message").values(messages).execute();
};

const seed = async (numberOfUsers = 15): Promise<void> => {
  await db.transaction().execute(async (trx) => {
    await sql`DELETE FROM public.user;`.execute(trx);
    await sql`DELETE FROM public.chat;`.execute(trx);
    await userGenerator(numberOfUsers, trx);
  });
};
try {
  process.stdout.write(chalk.greenBright("Running seed..."));
  await seed();
  process.stdout.write(chalk.greenBright.bold("DONE"));
} catch (err) {
  process.stdout.write(chalk.red.bold("ERROR!"));
  console.error(err);
} finally {
  await db.destroy();
  process.exit();
}
