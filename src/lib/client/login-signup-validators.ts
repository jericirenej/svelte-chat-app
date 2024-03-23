import { ZodIssueCode, z } from "zod";

const errorMessages = {
  username: "Please supply a username",
  password: "Please supply a password",
  email: "Please supply a valid email address",
  verify: "Password values must match"
};

const username = (msg?: string) => z.string().min(1, msg ?? errorMessages.username),
  password = (msg?: string) => z.string().min(1, msg ?? errorMessages.password);
export const loginSchema = z.object({
  username: username(),
  password: password()
});

export const signupSchema = z
  .object({
    username: username(),
    password: password(),
    verifyPassword: password(),
    email: z.string().email({ message: errorMessages.email }),
    name: z.string().optional(),
    surname: z.string().optional(),
  })
  .refine(({ password, verifyPassword }) => password.length && password === verifyPassword, {
    message: errorMessages.verify,
    path: ["verifyPassword"]
  });

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  describe("Login and signup form validators", () => {
    const username = "username",
      password = "password",
      email = "some.email@somewhere.com";
    it("LoginSchema should throw if password and / or username are not supplied", () => {
      const testCases: {
        schema: [string, string];
        err: Map<string, string>;
      }[] = [
        {
          schema: ["", ""],
          err: new Map([
            [username, errorMessages.username],
            [password, errorMessages.password]
          ])
        },
        {
          schema: [username, ""],
          err: new Map([[password, errorMessages.password]])
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
    it("Verify password should throw if length is less than one", () => {
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
    it("Signup schema should throw if password check does not match", () => {
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
    it("Signup schema should throw for invalid email", () => {
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
  });
}
