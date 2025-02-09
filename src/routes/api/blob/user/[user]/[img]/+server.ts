import { blobService } from "../../../../../../hooks.server";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
  const { user, img } = params;
  const file = await blobService.getFile(`user/${user}/${img}`);
  return new Response(file);
};
