import { getChatLabel } from "$lib/server/get-chat-label.js";
import { dbService } from "@db/index.js";
import type { LayoutChatData, ParticipantData } from "../types.js";
import type { LayoutServerLoad } from "./$types.js";
import { LAYOUT_INVALIDATE } from "$lib/client/chat-handlers.js";

export const load: LayoutServerLoad = async ({ locals, depends }) => {
  const user = locals.user;
  if (!user) return;

  depends(LAYOUT_INVALIDATE);

  const chatsResponse = await dbService.getChatsForUser(user.id);
  const chats = await Promise.all(
    chatsResponse.map(
      async ({ id: chatId, name: chatLabel, participants: users, messages, totalMessages }) => {
        const participants: ParticipantData[] = users.map(
          ({ id, username, name, surname, avatar }) => ({ id, username, name, surname, avatar })
        );
        return {
          chatId,
          chatLabel: getChatLabel(chatLabel, participants, user.id),
          message: messages[0]?.message,
          totalMessages,
          participants,
          unreadMessages: await dbService.getUnreadMessagesForParticipant(chatId, user.id)
        } satisfies LayoutChatData;
      }
    )
  );

  return { user, chats };
};
