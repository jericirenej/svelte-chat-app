import { dbService } from "@db/postgres";
import { json, redirect, type RequestHandler } from "@sveltejs/kit";
import { MESSAGE_TAKE, ROOT_ROUTE } from "../../../../constants";
import type { ParticipantData, SingleChatData } from "../../../../types";

export const GET: RequestHandler = async ({ params, locals, url }) => {
  const { user } = locals;
  if (!user) {
    return redirect(302, ROOT_ROUTE);
  }
  const chatId = params.chatId;
  if (!chatId) {
    return redirect(302, ROOT_ROUTE);
  }
  const takeParam = url.searchParams.get("take"),
    skipParam = url.searchParams.get("skip") ?? undefined;
  const [take, skip] = [takeParam, skipParam].map((param) => (param ? parseInt(param) : undefined));

  try {
    const messages = await dbService.getMessagesForChatParticipant(chatId, user.id, {
      take: take ?? MESSAGE_TAKE,
      skip
    });
    const participantsFull = await dbService.getParticipantsForChat(chatId);
    const participants: ParticipantData[] = participantsFull.map(
      ({ avatar, id, name, surname, username }) => ({ id, username, name, surname, avatar })
    );
    await dbService.setParticipantChatAccess(chatId, user.id);
    const data: SingleChatData = { ...messages, participants };
    return json(data);
  } catch {
    redirect(302, ROOT_ROUTE);
  }
};
