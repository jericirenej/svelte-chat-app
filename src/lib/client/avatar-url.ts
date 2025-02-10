import { BLOB_ROUTE } from "../../constants";

export const avatarBucketPath = (user: string) => `user/${user}/avatar.webp`;
export const avatarClientUrl = (user: string) => `${BLOB_ROUTE}/${avatarBucketPath(user)}`;
