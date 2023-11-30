import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Please supply a username"),
  password: z.string().min(1, "Please supply a password")
});
