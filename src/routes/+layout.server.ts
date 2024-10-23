import { participantName } from "$lib/utils.js";
import { dbService } from "@db/index.js";
import type { LayoutChatData, ParticipantData } from "../types.js";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) return;

  const chatsResponse = await dbService.getChatsForUser(user.id);
  const chats = await Promise.all(
    chatsResponse.map(
      async ({ id: chatId, name: chatLabel, participants: users, messages, totalMessages }) => {
        const participants: ParticipantData[] = users.map(
          ({ id, username, name, surname, avatar }) => ({ id, username, name, surname, avatar })
        );
        return {
          chatId,
          chatLabel:
            chatLabel ??
            participants
              .filter((p) => p.id !== user.id)
              .map((user) => participantName(user))
              .join(", "),
          message: messages[0].message,
          totalMessages,
          participants,
          unreadMessages: await dbService.getUnreadMessagesForParticipant(chatId, user.id)
        } satisfies LayoutChatData;
      }
    )
  );

  return { user, chats };
};
