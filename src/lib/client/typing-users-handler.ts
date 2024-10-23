import { toArray } from "../../helpers";
import type { MaybeArray, Nullish } from "../../types";

export const handleUsers = (users: MaybeArray<string> | Nullish): string | undefined => {
  const userArr = toArray(users).filter(Boolean) as string[];
  let subjects: string | undefined = undefined;
  if (!userArr.length) return subjects;
  const verb = userArr.length === 1 ? "is typing" : "are typing";
  switch (userArr.length) {
    case 1:
      subjects = userArr[0];
      break;
    case 2:
      subjects = userArr.join(" and ");
      break;
    default:
      subjects = [userArr.slice(0, -1).join(", "), userArr.at(-1) as string].join(", and ");
  }
  console.log(`${subjects} ${verb}`);
  return `${subjects} ${verb}`;
};
