export const avatarKeys = ["empty", "transparentBg", "full"] as const;
export type AvatarTypeKeys = (typeof avatarKeys)[number];
