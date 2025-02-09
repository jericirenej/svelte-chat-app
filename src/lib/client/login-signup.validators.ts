import { throwOnTruthy } from "$lib/utils";
import { ZodIssueCode, z } from "zod";
import { LENGTH_ERR_MESSAGES } from "../../messages";
import {
  AVATAR_SIZE_LIMIT,
  AVATAR_SIZE_LIMIT_ERR,
  PASSWORD_MIN,
  STRING_MAX,
  USERNAME_MIN
} from "../../constants";
import type { Infer, SuperValidated } from "sveltekit-superforms";

const errorMessages = {
  username: "Please supply a username",
  password: "Please supply a password",
  email: "Please supply a valid email address",
  verify: "Password values must match",
  avatarType: "Please upload a file.",
  avatarSize: `Max. ${AVATAR_SIZE_LIMIT_ERR} upload size.`,
  ...LENGTH_ERR_MESSAGES
};

const username = (msg?: string) => z.string().min(1, msg ?? errorMessages.username),
  password = (msg?: string) => z.string().min(1, msg ?? errorMessages.password);
export const loginSchema = z.object({
  username: username(),
  password: password()
});

export type LoginSchema = typeof loginSchema;
export type LoginFormData = SuperValidated<Infer<LoginSchema>>;

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
    surname: z.string().max(STRING_MAX, errorMessages.overMax(STRING_MAX)).optional(),
    avatar: z.optional(
      z
        .instanceof(Blob, { message: errorMessages.avatarType })
        .refine((blob) => blob.size < AVATAR_SIZE_LIMIT, errorMessages.avatarSize)
    )
  })
  .refine(({ password, verifyPassword }) => password.length && password === verifyPassword, {
    message: errorMessages.verify,
    path: ["verifyPassword"]
  });

export type SignupSchema = typeof signupSchema;
export type SignupFormData = SuperValidated<Infer<SignupSchema>>;

if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;
  const username = "username",
    password = "password-val",
    passwordPath = "password",
    email = "some.email@somewhere.com";
  const defaultVals = { username, password, verifyPassword: password, email };
  const singleErrConfirm = <T>(
    result: z.SafeParseReturnType<T, T>,
    errPath: string,
    errMsg: string
  ) => {
    throwOnTruthy(result.success);
    expect(result.error.errors).toHaveLength(1);
    const { message, path } = result.error.errors[0];
    expect(path[0]).toBe(errPath);
    expect(message).toBe(errMsg);
  };
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
          continue;
        }
        expect(err.size).toBe(0);
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
          continue;
        }
        expect(result.success).toBe(true);
      }
    });
    it("Throws for invalid email", () => {
      for (const emailVal of ["", "invalid", email]) {
        const result = signupSchema.safeParse({
          ...defaultVals,
          email: emailVal
        });
        if (!result.success) {
          singleErrConfirm(result, "email", errorMessages.email);
          continue;
        }
        expect(emailVal).toBe(email);
      }
    });
    it("Throws if username is too short", () => {
      const shortName = "sh";
      const result = signupSchema.safeParse({
        ...defaultVals,
        username: shortName
      });
      singleErrConfirm(result, "username", errorMessages.underMin(USERNAME_MIN));
    });
    it("Throws if password is too short", () => {
      const shortPassword = "sh";
      const result = signupSchema.safeParse({
        ...defaultVals,
        password: shortPassword,
        verifyPassword: shortPassword
      });
      singleErrConfirm(result, "password", errorMessages.underMin(PASSWORD_MIN));
    });
    it("Throws if non-blob supplied for avatar", () => {
      const str = "someBufferString";
      const buff = Buffer.from(str);
      const blob = new Blob([buff]);
      const file = new File([blob], "some-file.jpeg");
      for (const avatar of [buff, file, blob, str]) {
        const result = signupSchema.safeParse({
          ...defaultVals,
          avatar
        });
        if (avatar instanceof Blob) {
          expect(result.success).toBeTruthy();
          continue;
        }
        singleErrConfirm(result, "avatar", errorMessages.avatarType);
      }
    });
    it("Throws if blob size over limit", () => {
      const str = "someBufferString";
      const blob = new Blob([Buffer.from(str)]);
      const spyOnBuff = vi.spyOn(blob, "size", "get");
      const diff = 100;
      for (const overLimit of [false, true]) {
        spyOnBuff.mockReturnValue((overLimit ? diff : -diff) + AVATAR_SIZE_LIMIT);
        const result = signupSchema.safeParse({ ...defaultVals, avatar: blob });
        if (overLimit) {
          singleErrConfirm(result, "avatar", errorMessages.avatarSize);
          continue;
        }
        expect(result.success).toBeTruthy();
      }
      spyOnBuff.mockRestore();
    });
  });
}
