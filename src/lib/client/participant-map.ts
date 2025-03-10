import type { UserDto } from "../../../db/postgres";
import { CONVERSATION_MESSAGES } from "../../messages";
import type { Maybe } from "../../types";

export const getNameOrUsername = ({
  name,
  username,
  surname
}: Pick<UserDto, "username" | "name" | "surname">): string =>
  name && surname ? `${name} ${surname}` : username;

export const participantMap = (
  chatParticipants: Pick<UserDto, "name" | "surname" | "username" | "id">[]
): Map<string, string> => {
  return new Map(chatParticipants.map((user) => [user.id, getNameOrUsername(user)]));
};

export const getParticipant = (
  chatParticipants: Map<string, { name: string; avatar: Maybe<string> }>,
  targetUserId: string,
  loggedUserId: string
) =>
  targetUserId === loggedUserId
    ? CONVERSATION_MESSAGES.ownMessageAuthor
    : chatParticipants.get(targetUserId)?.name ?? CONVERSATION_MESSAGES.missingAuthor;
