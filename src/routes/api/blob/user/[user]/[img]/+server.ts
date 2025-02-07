import { BlobStorageService } from "@db/index";
import type { RequestHandler } from "./$types";

const blobService = new BlobStorageService();

export const GET: RequestHandler = async ({ params }) => {
  const { user, img } = params;
  const file = await blobService.getFile(`user/${user}/${img}`);
  return new Response(file);
};
