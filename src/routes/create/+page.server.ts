import { createChatSchema } from "$lib/client/createChat.validator";
import { getChatLabel } from "$lib/server/get-chat-label";
import { dbService } from "@db/postgres";
import type { Actions } from "@sveltejs/kit";
import { actionResult, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import type { ParticipantData } from "../../types";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const form = await superValidate(zod(createChatSchema));
  return { form };
};

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, zod(createChatSchema));
    const userId = locals.user?.id;
    if (!userId) {
      return actionResult("failure", { form }, { status: 403 });
    }
    if (!form.valid) {
      return actionResult("failure", { form }, { status: 400 });
    }
    const { participants: partialParticipants, chatLabel } = form.data;
    const { id, name } = await dbService.createChat({
      participants: [...partialParticipants, userId],
      name: chatLabel
    });
    const participants: ParticipantData[] = (await dbService.getParticipantsForChat(id)).map(
      (p) => ({
        avatar: p.avatar,
        id: p.id,
        name: p.name,
        surname: p.surname,
        username: p.username
      })
    );
    return {
      form,
      id,
      chatLabel: getChatLabel(name, participants, userId),
      participants
    };
  }
} satisfies Actions;
