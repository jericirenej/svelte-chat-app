import type { Infer, SuperValidated } from "sveltekit-superforms";
import type { createChatSchema } from "./createChat.validator";
import type { ParticipantData } from "../../types";

export type CreateChatSchema = typeof createChatSchema;
export type CreateChatFormData = SuperValidated<Infer<CreateChatSchema>>;

export type CreateChatResponseData = {
  id: string;
  participants: ParticipantData[];
  chatLabel: string;
};
