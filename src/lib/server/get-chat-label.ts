import { participantName } from "$lib/utils";
import type { Nullish, ParticipantData } from "../../types";

export const getChatLabel = (
  chatLabel: string | Nullish,
  participants: ParticipantData[],
  userId: string
): string =>
  chatLabel ??
  participants
    .filter((p) => p.id !== userId)
    .map((user) => participantName(user))
    .join(", ");
