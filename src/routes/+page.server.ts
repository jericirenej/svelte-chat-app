import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = ({ locals }) => {
  const { user } = locals;
  if (user) return { user };
};
