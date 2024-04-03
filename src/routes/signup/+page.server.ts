import { signupSchema } from "$lib/client/login-signup-validators";
import { generateSessionCookieAndCsrf } from "$lib/server/authenticate";
import { dbService, redisService } from "@db";
import { fail, type Actions } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { genPassword } from "../../../utils/generate-password";
import type { PageServerLoad } from "../login/$types";

export const load: PageServerLoad = async () => {
  const form = await superValidate(signupSchema);
  return { form };
};

export const actions = {
  default: async ({ request, cookies, url }) => {
    const form = await superValidate(request, signupSchema);
    if (!form.valid) {
      return fail(400, { form });
    }
    const { email, password, username: originalUsername, name, surname } = form.data;
    const username = originalUsername.toLowerCase();
    const isUserNameTaken = await dbService.usernameExists(username);
    const isEmailTaken = await dbService.emailExists(email);
    if (isUserNameTaken || isEmailTaken) {
      return fail(409, { form });
    }
    const { hash, salt } = genPassword(password);
    const user = await dbService.addUser({ hash, salt, username, email, name, surname });

    const { csrfToken } = await generateSessionCookieAndCsrf({ user, cookies, url, redisService });
    return {
      form,
      csrfToken
    };
  }
} satisfies Actions;
