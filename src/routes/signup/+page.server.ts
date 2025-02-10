import { avatarBucketPath, avatarClientUrl } from "$lib/client/avatar-url";
import { signupSchema } from "$lib/client/login-signup.validators";
import { generateSessionCookieAndCsrf } from "$lib/server/authenticate";
import { dbService } from "@db/postgres/db-service";
import { redisService } from "@db/redis";
import { fail, type Actions } from "@sveltejs/kit";
import sharp from "sharp";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { genPassword } from "../../../utils/generate-password";
import { AVATAR_SIZE } from "../../constants";
import { blobService } from "../../hooks.server";
import type { PageServerLoad } from "../login/$types";

export const load: PageServerLoad = async () => {
  const form = await superValidate(zod(signupSchema));
  return { form };
};

export const actions = {
  default: async ({ request, cookies, url }) => {
    const form = await superValidate(request, zod(signupSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    const {
      email,
      password,
      username: originalUsername,
      name,
      surname,
      avatar: avatarBlob
    } = form.data;
    // Since blobs can't be serialized, we set the avatar
    // prop to undefined
    form.data.avatar = undefined;
    const username = originalUsername.toLowerCase();
    const isUserNameTaken = await dbService.usernameExists(username);
    const isEmailTaken = await dbService.emailExists(email);
    if (isUserNameTaken || isEmailTaken) {
      return fail(409, { form });
    }
    const { hash, salt } = genPassword(password);

    if (avatarBlob) {
      try {
        const object = await sharp(Buffer.from(await avatarBlob.arrayBuffer()))
          .resize(AVATAR_SIZE, AVATAR_SIZE, { withoutEnlargement: true })
          .webp()
          .toBuffer();
        await blobService.uploadFile({
          object,
          name: avatarBucketPath(username),
          type: "image/webp"
        });
      } catch (err) {
        console.error("Avatar upload image failed", err);
        return fail(500, { form });
      }
    }

    const user = await dbService.addUser({
      hash,
      salt,
      username,
      email,
      name,
      surname,
      avatar: avatarBlob ? avatarClientUrl(username) : undefined
    });

    const { csrfToken } = await generateSessionCookieAndCsrf({ user, cookies, url, redisService });
    return {
      form,
      username,
      csrfToken
    };
  }
} satisfies Actions;
