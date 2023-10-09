import { fail } from "@sveltejs/kit";
import type { Actions } from "./$types";

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const username = data.get("username"),
      password = data.get("password");
    if (!username) {
      return fail(400, { username, missing: true });
    }
    if (!password) {
      return fail(400, { password, missing: true });
    }

    console.log(password, username);
    return { username, password };

    /* const isVerified = await verifyUser(username, password, dbService); */
  }
} satisfies Actions;
