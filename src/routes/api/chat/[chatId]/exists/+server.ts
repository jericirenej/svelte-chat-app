import { dbService } from "@db/postgres";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params }) => {
  const chatId = params.chatId;
  if (!chatId) return error(400);
  const exists = await dbService.chatExists(chatId);
  return json({ exists });
};
