import transparentBg from "@utils/avatars/transparentBg.webp";
import full from "@utils/avatars/full.webp";
import { avatarKeys, type AvatarTypeKeys } from "@utils/avatarKeys";
export const avatars: Record<AvatarTypeKeys, string | undefined> = {
  empty: undefined,
  full,
  transparentBg
};

export const assignAvatar = (num: number) => {
  return avatars[avatarKeys[(num + 1) % avatarKeys.length]];
};
export type { AvatarTypeKeys };
export { avatarKeys };
