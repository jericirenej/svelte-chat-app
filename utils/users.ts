import { v5 as uuid5 } from "uuid";

const BASE_UUID = "feec01c4-3e1a-4cde-9160-f114461d700e";

export const v5 = (...args: (string | number)[]): string => uuid5(args.join("-"), BASE_UUID);
export const createUserId = (username: string) => v5("user", username);
export const createEmail = (username: string): string => `${username}@nowhere.never`;

export const baseDate = new Date(2023, 0, 1, 12);

export const BASE_USERS = [
  {
    username: "babbage" as const,
    name: "Charles",
    surname: "Babbage"
  },
  {
    username: "lovelace" as const,
    name: "Ada",
    surname: "Lovelace",
    role: "superadmin" as const
  },
  {
    username: "liskov" as const,
    name: "Barbara",
    surname: "Liskov"
  },
  {
    username: "chu_lonzo" as const,
    name: "Alonzo",
    surname: "Church"
  },
  {
    username: "the_turing" as const,
    name: "Alan",
    surname: "Turing",
    role: "admin" as const
  },
  {
    username: "russel_guy" as const,
    name: "Bertrand",
    surname: "Russel"
  },
  {
    username: "incomplete_guy" as const,
    name: "Kurt",
    surname: "Gödel"
  },
  {
    username: "logician" as const,
    name: "George",
    surname: "Bool"
  }
];

export const USERS_WITH_ID = BASE_USERS.map((user) => ({
  ...user,
  id: createUserId(user.username),
  email: createEmail(user.username),
  createdAt: baseDate,
  updatedAt: baseDate
}));

export type AvailableUsers = (typeof BASE_USERS)[number]["username"];
export const byUsernames = (names: AvailableUsers[]) =>
  USERS_WITH_ID.filter((u) => names.some((name) => name === u.username));
