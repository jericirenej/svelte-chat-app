import { throwOnTruthy } from "$lib/utils";
import { ZodIssueCode, z } from "zod";
import { LENGTH_ERR_MESSAGES } from "../../messages";

export const USERNAME_MIN = 5,
  PASSWORD_MIN = 8,
  STRING_MAX = 100;

const errorMessages = {
  username: "Please supply a username",
  password: "Please supply a password",
  email: "Please supply a valid email address",
  verify: "Password values must match",
  ...LENGTH_ERR_MESSAGES
};

const username = (msg?: string) => z.string().min(1, msg ?? errorMessages.username),
  password = (msg?: string) => z.string().min(1, msg ?? errorMessages.password);
export const loginSchema = z.object({
  username: username(),
  password: password()
});

export const signupSchema = z
  .object({
    username: username()
      .min(USERNAME_MIN, errorMessages.underMin(USERNAME_MIN))
      .max(STRING_MAX, errorMessages.overMax(STRING_MAX)),
    password: password()
      .min(PASSWORD_MIN, errorMessages.underMin(PASSWORD_MIN))
      .max(STRING_MAX, errorMessages.overMax(STRING_MAX)),
    verifyPassword: password().min(1).max(STRING_MAX),
    email: z.string().email({ message: errorMessages.email }),
    name: z.string().max(STRING_MAX, errorMessages.overMax(STRING_MAX)).optional(),
    surname: z.string().max(STRING_MAX, errorMessages.overMax(STRING_MAX)).optional()
  })
  .refine(({ password, verifyPassword }) => password.length && password === verifyPassword, {
    message: errorMessages.verify,
    path: ["verifyPassword"]
  });

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  const username = "username",
    password = "password-val",
    passwordPath = "password",
    email = "some.email@somewhere.com";
  describe("Login form validator", () => {
    it("Throws if password and / or username are not supplied", () => {
      const testCases: {
        schema: [string, string];
        err: Map<string, string>;
      }[] = [
        {
          schema: ["", ""],
          err: new Map([
            [username, errorMessages.username],
            [passwordPath, errorMessages.password]
          ])
        },
        {
          schema: [username, ""],
          err: new Map([[passwordPath, errorMessages.password]])
        },
        {
          schema: ["", password],
          err: new Map([[username, errorMessages.username]])
        },
        {
          schema: [username, password],
          err: new Map()
        }
      ];
      for (const { schema, err } of testCases) {
        const [username, password] = schema;
        const result = loginSchema.safeParse({ username, password });
        if (!result.success) {
          const { errors } = result.error;
          errors.forEach(({ path, message }) => {
            const target = path[0] as string;
            expect(err.get(target)).not.toBeUndefined();
            expect(message).toBe(err.get(target));
          });
        } else {
          expect(err.size).toBe(0);
        }
      }
    });
  });
  describe("Signup validator schema", () => {
    it("Throws if length is less than one", () => {
      const result = signupSchema.safeParse({
        username,
        password,
        email,
        verifyPassword: ""
      }) as z.SafeParseError<typeof signupSchema>;
      const targetError = result.error.errors.find(({ code }) => code === ZodIssueCode.too_small);
      expect(targetError).toBeDefined();
      const { path, message } = targetError as z.ZodIssue;
      expect(path[0]).toBe("verifyPassword");
      expect(message).toBe(errorMessages.password);
    });
    it("Throws if password check does not match", () => {
      for (const verifyPassword of ["1", "invalid", password]) {
        const result = signupSchema.safeParse({
          username,
          password,
          email,
          verifyPassword
        });
        if (!result.success) {
          expect(verifyPassword).not.toBe(password);
          expect(result.error.errors).toHaveLength(1);
          const { message, path } = result.error.errors[0];
          expect(message).toBe(errorMessages.verify);
          expect(path[0]).toBe("verifyPassword");
        } else {
          expect(result.success).toBe(true);
        }
      }
    });
    it("Throws for invalid email", () => {
      for (const emailVal of ["", "invalid", email]) {
        const result = signupSchema.safeParse({
          username,
          password,
          verifyPassword: password,
          email: emailVal
        });
        if (!result.success) {
          expect(result.error.errors).toHaveLength(1);
          const { message, path } = result.error.errors[0];
          expect(path[0]).toBe("email");
          expect(message).toBe(errorMessages.email);
        } else {
          expect(emailVal).toBe(email);
        }
      }
    });
    it("Throws if username is too short", () => {
      const shortName = "sh";
      const result = signupSchema.safeParse({
        username: shortName,
        password,
        verifyPassword: password,
        email
      });
      throwOnTruthy(result.success);
      expect(result.error.errors).toHaveLength(1);
      const { message, path } = result.error.errors[0];
      expect(path[0]).toBe("username");
      expect(message).toBe(errorMessages.underMin(USERNAME_MIN));
    });
    it("Throws if password is too short", () => {
      const shortPassword = "sh";
      const result = signupSchema.safeParse({
        username,
        password: shortPassword,
        verifyPassword: shortPassword,
        email
      });
      throwOnTruthy(result.success);
      expect(result.error.errors).toHaveLength(1);
      const { message, path } = result.error.errors[0];
      expect(path[0]).toBe("password");
      expect(message).toBe(errorMessages.underMin(PASSWORD_MIN));
    });
  });
}
