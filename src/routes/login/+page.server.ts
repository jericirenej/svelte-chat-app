import { dbService, redisService } from "@db";
import { error, fail } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms/server";
import { SESSION_COOKIE } from "../../constants.js";
import {
  VERIFICATION_FAILURE,
  generateCsrfToken,
  generateSessionId,
  verifyUser
} from "../../lib/server/password-utils.js";
import type { Actions, PageServerLoad } from "./$types";
import { loginSchema } from "./login-form-validator.js";

export const load: PageServerLoad = async () => {
  const form = await superValidate(loginSchema);
  return { form };
};

export const actions = {
  default: async ({ request, cookies }) => {
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
    const sessionId = generateSessionId(user.id);
    await redisService.setSession(sessionId, user);
    cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      maxAge: redisService.ttl,
      sameSite: true
    });
    const csrfToken = generateCsrfToken(sessionId);
    return {
      form,
      csrfToken
    };
  }
} satisfies Actions;
