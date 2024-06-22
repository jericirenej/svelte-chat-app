import { v5 as uuid5 } from "uuid";
export const createEmail = (username: string): string => `${username}@nowhere.never`;

const BASE_UUID = "feec01c4-3e1a-4cde-9160-f114461d700e";

export const v5 = (...args: (string | number)[]): string => uuid5(args.join("-"), BASE_UUID);

export const BASE_USERS = [
  {
    username: "babbage" as const,
    name: "Charles",
    surname: "Babbage",
    email: createEmail("babbage15")
  },
  {
    username: "lovelace" as const,
    name: "Ada",
    surname: "Lovelace",
    email: createEmail("lovelace"),
    admin: "superadmin" as const
  },
  {
    username: "liskov" as const,
    name: "Barbara",
    surname: "Liskov",
    email: createEmail("no_substitute")
  },
  {
    username: "chu_lonzo" as const,
    name: "Alonzo",
    surname: "Church",
    email: createEmail("chu_lonzo")
  },
  {
    username: "the_turing" as const,
    name: "Alan",
    surname: "Turing",
    email: createEmail("turing_machine"),
    admin: "admin" as const
  },
  {
    username: "russel_guy" as const,
    name: "Bertrand",
    surname: "Russel",
    email: createEmail("i_am_whole")
  },
  {
    username: "incomplete_guy" as const,
    name: "Kurt",
    surname: "Gödel",
    email: createEmail("kgodel")
  },
  {
    username: "logician" as const,
    name: "George",
    surname: "Bool",
    email: createEmail("gbool")
  }
].map((user) => ({ ...user, id: v5("user", user.username) }));

export type BaseUsernames = (typeof BASE_USERS)[number]["username"];
export const byUsernames = (names: BaseUsernames[]) =>
  BASE_USERS.filter((u) => names.includes(u.username));
