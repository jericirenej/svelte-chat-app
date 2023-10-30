import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = ({ locals }) => {
  const user = locals.user;
  if (user) return { user };
};
