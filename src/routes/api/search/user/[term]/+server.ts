import { dbService } from "@db/postgres";
import { json, type RequestHandler } from "@sveltejs/kit";
import type { Entity } from "../../../../../types";
import { getNameOrUsername } from "$lib/client/participant-map";

export const GET: RequestHandler<{ term: string }> = async ({ params, url }) => {
  const excluded = url.searchParams.get("excluded");
  const users = await dbService.searchForUsers(params.term, excluded?.split(",") ?? []);
  return json({
    data: users.map(
      ({ avatar, id, name, surname, username }) =>
        ({ avatar, id, name: getNameOrUsername({ name, surname, username }) }) as Entity
    )
  });
};
