import { describe, it, expect, vi } from "vitest";
import { throwOnTruthy } from "$lib/utils";
import { errorMessages, loginSchema, signupSchema } from "./login-signup.validators";
import { ZodIssueCode, type z } from "zod";
import { AVATAR_SIZE_LIMIT, PASSWORD_MIN, USERNAME_MIN } from "../../constants";
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
