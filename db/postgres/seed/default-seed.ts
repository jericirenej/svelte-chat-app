import { BASE_USERS as users } from "../../../utils/users.js";
import {
  type ChatSchema,
  evenUserPick,
  randomUserPick,
  Seeder,
  type SeederConstructorParams
} from "./seed";
import MESSAGES from "./seed.messages.js";

export type UserNames = (typeof users)[number]["username"];
const prefixMessage = (msg: string, index: number) => `Msg ${index + 1}: ${msg}`;

const CHAT_LENGTHS = [64, 8, 4];

const chats: ChatSchema<UserNames>[] = [
  {
    participants: ["lovelace", "the_turing", "babbage"],
    name: "A conversation between admins",
    messages: Array.from(Array(64), (_, i) => ({
      username: randomUserPick("lovelace", "the_turing", "babbage"),
      message: prefixMessage(MESSAGES[i], i)
    }))
  }
];
chats.push({
  participants: ["incomplete_guy", "chu_lonzo"],
  messages: Array.from(Array(8), (_, i) => ({
    username: evenUserPick<UserNames>(i, "incomplete_guy", "chu_lonzo"),
    message: prefixMessage(MESSAGES[CHAT_LENGTHS[0] + i], i)
  }))
});
chats.push({
  participants: ["lovelace", "liskov"],
  name: "Very hush hush",
  messages: Array.from(Array(4), (_, i) => ({
    username: evenUserPick<UserNames>(i, "lovelace", "liskov"),
    message: prefixMessage(MESSAGES[CHAT_LENGTHS[0] + CHAT_LENGTHS[1] + i], i)
  }))
});

export { chats, users };

export const seed = async (params: SeederConstructorParams) => {
  const seeder = new Seeder(params);
  await seeder.clearDb();
  await seeder.createUsers(users);
  await seeder.createChats(chats);
};
