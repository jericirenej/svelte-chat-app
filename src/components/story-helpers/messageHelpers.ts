import { faker } from "@faker-js/faker";
import type { MessageDto } from "../../../db/postgres";
import type { Writable } from "svelte/store";
import { add, sub } from "date-fns";
import { participantMap } from "$lib/client/participant-map";
import { byUsernames, type BaseUsernames } from "@utils/base-users";

export const baseDate = sub(new Date(), { hours: 10 });

export const chatId = "chatId";
export const chatUserNames = ["lovelace", "the_turing", "logician"] satisfies BaseUsernames[];
const userArray = byUsernames(chatUserNames);
export const chatUserIds = userArray.map(({ id }) => id);
export const chatParticipants = participantMap(userArray);
console.log(chatParticipants);

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
  const userId = userArray[Math.floor(Math.random() * chatUserNames.length)].id;
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
