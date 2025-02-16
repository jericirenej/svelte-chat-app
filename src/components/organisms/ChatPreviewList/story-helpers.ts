import { v4 } from "uuid";
import type { ChatPreviewProp } from "./types";
import { BASE_USERS } from "@utils/users";
import { handleUsers } from "$lib/client/typing-users-handler";
import { participantName } from "$lib/utils";
import type { ParticipantData, UsersTyping } from "../../../types";

const baseChatList = [
  {
    chatId: "0",
    chatLabel: "Linda Lovelace",
    message: "I think so too!"
  },
  {
    chatId: "1",
    chatLabel: "Linda Lovelace, Alan Turing",
    message: "Well that's never going to work..."
  },
  {
    chatId: "2",
    chatLabel: "On the meaning of life",
    message: "That might be complicated, I think"
  }
] satisfies ChatPreviewProp[];
export const chatPreviewList = Array.from(
  [0, 1, 2].flatMap(() => baseChatList.map((c) => ({ ...c, chatId: v4() })))
);
export const chatUnreadList = [0, 10, 120].reduce(
  (acc, curr, i) => {
    const id = chatPreviewList[i].chatId;
    acc[id] = curr;
    return acc;
  },
  {} as Record<string, number>
);

export const activeUserOptions = BASE_USERS.map(({ username }) => username as string);

export const simulateUsersTyping = (users: string[]) => {
  const targetUsers = users
    .map((username) => BASE_USERS.find((u) => u.username === username))
    .filter((u) => u !== undefined) as ParticipantData[];

  return chatPreviewList.reduce((acc, { chatId }) => {
    acc[chatId] = {
      label: handleUsers(targetUsers.map((u) => participantName(u))),
      list: new Set(users)
    };
    return acc;
  }, {} as UsersTyping);
};
