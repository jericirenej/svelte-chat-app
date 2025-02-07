import { USERS_WITH_ID } from "@utils/users";
import { assignAvatar } from "../story-helpers/avatars";

export const searchUsers = async (term: string, excludedIds?: string[]) => {
  return Promise.resolve(
    USERS_WITH_ID.filter((u) =>
      [u.username, u.name, u.surname]
        .map((val) => val.toLowerCase())
        .some((val) => !!term && val.includes(term.toLowerCase()))
    )
      .map(({ id, name, surname }, i) => ({
        id,
        name: `${name} ${surname}`,
        avatar: assignAvatar(i)
      }))
      .filter(({ id }) => {
        return !excludedIds?.length ? true : !excludedIds.includes(id);
      })
  );
};
