import type { CreateUserDto } from "@db";
import { error, type HttpError } from "@sveltejs/kit";
import { z, ZodType } from "zod";

const DEFAULT_MIN = 3,
  DEFAULT_MAX = 100;

const lengthErr = (
  prop: string,
  num: number,
  type: "string" | "number" = "string",
  limit: "max" | "min" = "min"
): string => {
  const formattedProp = [prop[0].toUpperCase(), prop.slice(1)].join("");
  const limitPart = limit === "min" ? "should be at least" : "should not be more than";
  const typePart = type === "string" ? "characters long" : "";
  return `${formattedProp} ${limitPart} ${num} ${typePart}`.trim();
};

const defaultStringMinErr = (prop: string, num = DEFAULT_MIN): string =>
  lengthErr(prop, num, "string", "min");
const defaultStringMaxErr = (prop: string, num = DEFAULT_MAX): string =>
  lengthErr(prop, num, "string", "max");

const CreateUserSchema = z
  .object({
    username: z
      .string({ required_error: "A username must be provided" })
      .min(DEFAULT_MIN, defaultStringMinErr("username"))
      .max(100, defaultStringMaxErr("username")),
    email: z
      .string({ required_error: "An email must be provided" })
      .email("A valid email should be supplied")
      .min(DEFAULT_MIN, defaultStringMinErr("email"))
      .max(100, defaultStringMaxErr("email")),
    name: z
      .string()
      .min(DEFAULT_MIN, defaultStringMinErr("name"))
      .max(100, defaultStringMaxErr("name"))
      .optional(),
    surname: z
      .string()
      .min(DEFAULT_MIN, defaultStringMinErr("surname"))
      .max(100, defaultStringMaxErr("surname"))
      .optional(),
    avatar: z.string().optional(),
    hash: z.string({ required_error: "Password hash is required" }),
    salt: z.string({ required_error: "Password salt is required}" })
    /*
    name: optional(
      string([
        minLength(DEFAULT_MIN, defaultStringMinErr("name")),
        maxLength(100, defaultStringMaxErr("name"))
      ])
    ),
    surname: optional(
      string([
        minLength(DEFAULT_MIN, defaultStringMinErr("surname")),
        maxLength(100, defaultStringMaxErr("surname"))
      ])
    ),
    avatar: optional(string()),
    hash: string("Password hash is required"),
    salt: string("Password salt is required") */
  })
  .strict("No extra properties allowed");

export const validateRequest = <T>(schema: ZodType<T>, input: T): T => {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const msg = result.error.issues.map(({ message }) => message).join("\n");
  throw error(400, msg);
};

export const validateUserCreate = (input: CreateUserDto) => {
  return validateRequest(CreateUserSchema, input);
};

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  describe("validateCreateUser", () => {
    const validCreate = {
      email: "email@somewhere.com",
      hash: "someHash",
      salt: "someSalt",
      username: "username",
      avatar: "avatar-data",
      name: "name",
      surname: "surname"
    } satisfies CreateUserDto;
    it("Should validate", () => {
      expect(validateUserCreate(validCreate)).toEqual(validCreate);
    });
    it("Should not throw if optional properties are missing", () => {
      const valid = JSON.parse(JSON.stringify(validCreate)) as CreateUserDto;
      (["avatar", "name", "surname"] as const).forEach((prop) => {
        delete validCreate[prop];
      });
      expect(validateUserCreate(valid)).toEqual(valid);
    });
    it("Should throw if constraints are violated", () => {
      const invalidProps = {
        username: "1",
        email: "invalidEmail",
        name: new Array(DEFAULT_MAX + 1).fill("a").join("")
      } satisfies Partial<Record<keyof CreateUserDto, string>>;
      try {
        validateUserCreate({
          ...validCreate,
          ...invalidProps
        });
      } catch (err) {
        const typeErr = err as HttpError;
        expect(typeErr.status).toBe(400);
        expect(typeErr.body.message.split("\n").length).toBe(3);
      }
    });
    it("Should throw if extra properties are present", () => {
      try {
        validateUserCreate({ ...validCreate, extra: "extra" } as unknown as CreateUserDto);
      } catch (err) {
        expect(err).toBeTruthy();
      }
    });
  });
}
