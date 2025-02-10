import { resolve } from "path";
import type { AvatarTypeKeys } from "./avatarKeys";

const baseDir = import.meta.dirname;
export const avatarTypes = {
  empty: undefined,
  transparentBg: resolve(baseDir, "avatars/transparentBg.webp"),
  /** Abby avatar converted to base64 and pulled from [Dicebear.com](https://www.dicebear.com/playground/) which is a remix of:
   * Adventurer Neutral by Lisa Wischofsky, licensed under CC BY 4.0*/
  full: resolve(baseDir, "avatars/full.webp")
} satisfies Record<AvatarTypeKeys, string | undefined>;
