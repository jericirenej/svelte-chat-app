import type { UserDto } from "../../../db/postgres";
import { CONVERSATION_MESSAGES } from "../../messages";

export const participantMap = (
  chatParticipants: Pick<UserDto, "name" | "surname" | "username" | "id">[]
): Map<string, string> => {
  return new Map(
    chatParticipants.map(({ name, surname, id, username }) => [
      id,
      name && surname ? `${name} ${surname}` : username
    ])
  );
};

export const getParticipant = (
  chatParticipants: Map<string, string>,
  targetUserId: string,
  loggedUserId: string
) =>
  targetUserId === loggedUserId
    ? CONVERSATION_MESSAGES.ownMessageAuthor
    : chatParticipants.get(targetUserId) ?? CONVERSATION_MESSAGES.missingAuthor;
