import { faker } from "@faker-js/faker";
import type { MessageDto } from "../../../db/postgres";
import { get, type Writable } from "svelte/store";
import { add, sub } from "date-fns";
import { participantMap } from "$lib/client/participant-map";
import { byUsernames, type AvailableUsers } from "@utils/users";

export const baseDate = sub(new Date(), { hours: 10 });

export type ContainerProps = {
  containerWidth: number;
  containerHeight: number;
  initialTotal: number;
};
export const baseContainerArgs: ContainerProps = {
  containerWidth: 100,
  containerHeight: 400,
  initialTotal: 30
};

export const pickContainerArgs = (
  obj: ContainerProps & Record<string, unknown>
): ContainerProps => ({
  containerWidth: obj.containerWidth,
  containerHeight: obj.containerHeight,
  initialTotal: obj.initialTotal
});
export const chatId = "chatId";
export const chatUserNames = ["lovelace", "the_turing", "logician"] satisfies AvailableUsers[];
const userArray = byUsernames(chatUserNames);
export const chatUserIds = userArray.map(({ id }) => id);
export const chatParticipants = participantMap(userArray);

export const createMessage = (userId: string, createdAt: Date, message?: string): MessageDto => {
  return {
    id: crypto.randomUUID(),
    userId,
    chatId,
    message: message ?? faker.lorem.lines({ min: 1, max: 3 }),
    createdAt,
    updatedAt: createdAt,
    deleted: false
  };
};

export const addMessage = (store: Writable<MessageDto[]>, atBeginning = false) => {
  const userId = userArray[Math.floor(Math.random() * chatUserNames.length)].id;
  store.update((msg) => {
    const lastMessage = msg[msg.length - 1];
    const date = atBeginning
      ? sub(msg[0]?.createdAt ?? baseDate, { minutes: 10 })
      : add(lastMessage.createdAt, { minutes: 10 });
    const newMessage = createMessage(userId, date);
    // Messages are received from newest to oldest so we
    // have to unshift for new messages and push for older ones
    if (atBeginning) {
      msg.push(newMessage);
    } else {
      msg.unshift(newMessage);
    }
    return msg;
  });
};

export const baseMessages: MessageDto[] = [
  createMessage(chatUserIds[1], baseDate),
  createMessage(chatUserIds[1], add(baseDate, { minutes: 10 })),
  createMessage(chatUserIds[0], add(baseDate, { minutes: 20 }))
];
export const handleAdd = (store: Writable<MessageDto[]>, total: number, atBeginning?: boolean) => {
  if (atBeginning) {
    const toLoad = Math.min(5, get(store).length);
    new Array(toLoad).fill(0).forEach(() => {
      addMessage(store, atBeginning);
    });
    return;
  }
  addMessage(store);
  total++;
};
