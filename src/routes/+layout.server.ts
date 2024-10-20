import { participantName } from "$lib/utils.js";
import { dbService } from "@db/index.js";
import type { LayoutChatData } from "../types.js";
import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) return;

  const chatsResponse = await dbService.getChatsForUser(user.id);

  const chats = await Promise.all(
    chatsResponse.map(
      async ({ id: chatId, name: chatLabel, participants, messages, totalMessages }) => {
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
          unreadMessages: await dbService.getUnreadMessagesForParticipant(chatId, user.id)
        } satisfies LayoutChatData;
      }
    )
  );

  return { user, chats };
};
