import { resolve } from "path";
import type { AvatarTypeKeys } from "./avatarKeys";

const baseDir = import.meta.dirname;
export const avatarTypes = {
  empty: undefined,
  transparentBg: resolve(baseDir, "avatars/transparentBg.webp"),
  full: resolve(baseDir, "avatars/full.webp")
} satisfies Record<AvatarTypeKeys, string | undefined>;
