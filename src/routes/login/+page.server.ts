import { generateSessionCookieAndCsrf } from "$lib/server/authenticate.js";
import { dbService, redisService } from "@db";
import { error, fail } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms/server";
import { loginSchema } from "../../lib/client/login-signup-validators.js";
import { VERIFICATION_FAILURE, verifyUser } from "../../lib/server/password-utils.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const form = await superValidate(loginSchema);
  return { form };
};

export const actions = {
  default: async ({ request, cookies, url }) => {
    const form = await superValidate(request, loginSchema);

    if (!form.valid) {
      return fail(400, { form });
    }

    const { username: originalUsername, password } = form.data;
    const username = originalUsername.toLowerCase();
    const isVerified = await verifyUser(username, password, dbService);
    if (!isVerified) {
      return setError(form, "", VERIFICATION_FAILURE, { status: 404 });
    }

    const user = await dbService.getUser({
      property: "username",
      value: username
    });
    if (!user) {
      throw error(500, "Something went wrong while fetching user from the database");
    }
    const { csrfToken } = await generateSessionCookieAndCsrf({ cookies, user, redisService, url });

    return {
      form,
      csrfToken
    };
  }
} satisfies Actions;
