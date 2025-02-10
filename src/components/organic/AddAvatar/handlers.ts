import type { Maybe } from "../../../types";

const asyncReadFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        resolve(reader.result as string);
      },
      {
        once: true
      }
    );
    reader.addEventListener("error", () => reject, { once: true });
    reader.readAsDataURL(file);
  });
};
export const uploadHandler = async ([file]: FileList): Promise<
  { err: string } | { data: string }
> => {
  const allowed = ["jpeg", "png", "webp"].map((type) => `image/${type}`);
  if (!allowed.includes(file.type)) {
    return { err: "Invalid file type provided." };
  }
  try {
    return { data: await asyncReadFile(file) };
  } catch (err) {
    return { err: err instanceof Error ? err.message : JSON.stringify(err) };
  }
};

export const dataUrlToBlobHandler = async (dataUrl: Maybe<string>): Promise<Blob> => {
  if (!dataUrl) throw new Error("Supply data URL!");
  return await fetch(dataUrl).then((r) => r.blob());
};
