import { authenticateUser } from "$lib/server/authenticate.js";
import { redirect, type Handle } from "@sveltejs/kit";
import { SESSION_COOKIE, UNPROTECTED_ROUTES } from "./constants.js";

export const handle: Handle = async ({ event, resolve }) => {
  const user = await authenticateUser(event);
  const { pathname } = event.url;
  if (UNPROTECTED_ROUTES.includes(pathname)) {
    console.log("UNPROTECTED");
    return await resolve(event);
  }

  console.log("PROTECTED");

  if (!user) {
    event.cookies.delete(SESSION_COOKIE);
    throw redirect(302, "/login");
  }

  event.locals.user = user;

  return await resolve(event);
};
