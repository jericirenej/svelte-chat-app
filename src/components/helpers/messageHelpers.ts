import { faker } from "@faker-js/faker";
import type { MessageDto } from "../../../db/postgres";
import type { Writable } from "svelte/store";
import { add, sub } from "date-fns";

export const baseDate = sub(new Date(), { hours: 10 });

type Users = "lovelace" | "turing" | "bool";
export const chatId = "chatId";
export const chatUsers: [Users, string][] = [
  ["lovelace", "Ada"],
  ["turing", "Alan"],
  ["bool", "George"]
];
export const chatParticipants = new Map<Users, string>(chatUsers);

export const createMessage = (userId: string, createdAt: Date): MessageDto => {
  return {
    id: crypto.randomUUID(),
    userId,
    chatId,
    message: faker.lorem.lines({ min: 1, max: 3 }),
    createdAt,
    updatedAt: createdAt,
    deleted: false
  };
};

export const addMessage = (store: Writable<MessageDto[]>, atBeginning = false) => {
  const userId = chatUsers[Math.floor(Math.random() * chatUsers.length)][0];
  store.update((msg) => {
    const date = atBeginning
      ? sub(msg[0]?.createdAt ?? baseDate, { minutes: 10 })
      : add(baseDate, { minutes: msg.length * 10 });
    const newMessage = createMessage(userId, date);
    if (atBeginning) {
      msg.unshift(newMessage);
    } else {
      msg.push(newMessage);
    }
    return msg;
  });
};
