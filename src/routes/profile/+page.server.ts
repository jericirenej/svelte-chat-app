import type { PageServerLoad } from "./$types";
export const load: PageServerLoad = ({ locals }) => {
  const { user } = locals;
  if (user) return { user };
};
