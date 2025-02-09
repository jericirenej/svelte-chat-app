import type { Infer, SuperValidated } from "sveltekit-superforms";
import { z } from "zod";
import {
  AVATAR_SIZE_LIMIT,
  AVATAR_SIZE_LIMIT_ERR,
  PASSWORD_MIN,
  STRING_MAX,
  USERNAME_MIN
} from "../../constants";
import { LENGTH_ERR_MESSAGES } from "../../messages";

export const errorMessages = {
  username: "Please supply a username",
  password: "Please supply a password",
  email: "Please supply a valid email address",
  verify: "Password values must match",
  avatarType: "Please upload a file.",
  avatarSize: `Max. ${AVATAR_SIZE_LIMIT_ERR} upload size.`,
  ...LENGTH_ERR_MESSAGES
};

export const username = (msg?: string) => z.string().min(1, msg ?? errorMessages.username),
  password = (msg?: string) => z.string().min(1, msg ?? errorMessages.password),
  loginSchema = z.object({
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
