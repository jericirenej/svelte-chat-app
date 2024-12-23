import { redirect } from "@sveltejs/kit";
import type { SingleChatData } from "../../../types";
import type { PageLoad } from "./$types";
import { ROOT_ROUTE } from "../../../constants";
// eslint-disable-next-line @typescript-eslint/unbound-method
export const load: PageLoad = async ({ params, fetch, parent }) => {
  const { user } = await parent();
  if (!user) {
    return redirect(302, ROOT_ROUTE);
  }
  try {
    const response = await fetch(`/api/chat/${params.chatId}`);
    const data = (await response.json()) as SingleChatData;
    return { ...data, user };
  } catch {
    return redirect(302, ROOT_ROUTE);
  }
};
