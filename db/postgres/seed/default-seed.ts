import { Kysely } from "kysely";
import { BASE_USERS as users } from "../../../utils/users.js";
import type { DB } from "../db-types";
import { type ChatSchema, pickUser, Seeder } from "./seed";
import MESSAGES from "./seed.messages.js";

type UserNames = (typeof users)[number]["username"];
const prefixMessage = (msg: string, index: number) => `Msg ${index + 1}: ${msg}`;

const chats: ChatSchema<UserNames>[] = [
  {
    participants: ["lovelace", "the_turing"],
    name: "A conversation between admins",
    messages: Array.from(Array(64), (_, i) => ({
      username: pickUser<UserNames>(i, "lovelace", "the_turing"),
      message: prefixMessage(MESSAGES[i], i)
    }))
  }
] satisfies ChatSchema<UserNames>[];
chats.push({
  participants: ["incomplete_guy", "chu_lonzo"],
  messages: Array.from(Array(8), (_, i) => ({
    username: pickUser<UserNames>(i, "incomplete_guy", "chu_lonzo"),
    message: prefixMessage(MESSAGES[chats[0].messages.length + i], i)
  }))
});
chats.push({
  participants: ["lovelace", "liskov"],
  name: "Very hush hush",
  messages: Array.from(Array(4), (_, i) => ({
    username: pickUser<UserNames>(i, "lovelace", "liskov"),
    message: prefixMessage(MESSAGES[chats[1].messages.length + i], i)
  }))
});

export { chats, users };

export const seed = async (db: Kysely<DB>, log = false) => {
  const seeder = new Seeder(db, log);

  await seeder.clearDb();
  await seeder.createUsers(users);
  await seeder.createChats(chats);
};
