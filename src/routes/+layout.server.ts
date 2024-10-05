import { dbService } from "@db/index.js";
import type { LayoutServerLoad } from "./$types.js";
import type { ChatPreviewProp } from "../components/organic/ChatPreviewList/types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) return;

  const chatsResponse = await dbService.getChatsForUser(user.id);
  const chats = chatsResponse.map(({ id: chatId, name: chatLabel, participants, messages }) => {
    return {
      chatId,
      chatLabel:
        chatLabel ??
        participants
          .filter((p) => p.id !== user.id)
          .map(({ name, surname, username }) => {
            const val = [name, surname].filter(Boolean).join(" ");
            return val ? val : username;
          })
          .join(", "),
      message: messages[0].message,
      unreadMessages: messages.length
    } satisfies ChatPreviewProp;
  });

  return { user, chats };
};
