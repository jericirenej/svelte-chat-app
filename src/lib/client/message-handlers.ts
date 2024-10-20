import type { MessageDto } from "@db/postgres";
import { csrfHeader, getCSRFLocal } from "./csrf-handlers";

export const postChatMessage = async (
  href: string,
  message: string
): Promise<MessageDto | false> => {
  try {
    const csrf = getCSRFLocal();
    if (!csrf) return false;
    const response = await fetch(href, {
      method: "POST",
      body: JSON.stringify({ message }),
      headers: { "content-type": "application/json", ...csrfHeader(csrf) }
    });
    const data = (await response.json()) as MessageDto;
    return data;
  } catch {
    return false;
  }
};
