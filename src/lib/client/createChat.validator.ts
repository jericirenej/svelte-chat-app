import { throwOnTruthy } from "$lib/utils";
import { z } from "zod";
import { LENGTH_ERR_MESSAGES } from "../../messages";

export const LABEL_MIN = 5,
  PARTICIPANTS_MIN = 1;
export const errorMessages = {
  participants: "Chat must have at least one other participant",
  ...LENGTH_ERR_MESSAGES
};

const participants = (msg?: string) =>
  z
    .string()
    .array()
    .min(PARTICIPANTS_MIN, msg ?? errorMessages.participants);
const chatLabel = z.string().optional();

export const createChatSchema = z
  .object({ participants: participants(), chatLabel: chatLabel })
  // Empty strings should be nullified
  .transform(({ participants, chatLabel }) => ({
    participants,
    chatLabel: !chatLabel?.length ? undefined : chatLabel
  }))
  .superRefine(({ chatLabel }, ctx) => {
    if (chatLabel && chatLabel.length !== 0 && chatLabel.length < LABEL_MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: LABEL_MIN,
        inclusive: true,
        type: "string",
        message: errorMessages.underMin(LABEL_MIN),
        path: ["chatLabel"]
      });
    }
  });

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  describe("CreateChatValidator", () => {
    it("Throws if less than 2 participants", () => {
      for (const participants of [
        undefined,
        [],
        ["one"],
        ["one", "two"],
        ["one", "two", "three"]
      ]) {
        const result = createChatSchema.safeParse({ participants });
        if (!participants || participants.length < PARTICIPANTS_MIN) {
          throwOnTruthy(result.success);
          expect(result.error.errors).toHaveLength(1);
          const { path, message } = result.error.errors[0];
          expect(path[0]).toBe("participants");
          if (participants === undefined) {
            expect(message).toBe("Required");
          } else {
            expect(message).toBe(errorMessages.participants);
          }
          continue;
        }
        expect(result.success).toBeTruthy();
      }
    });
    it("Throws if chat label is under limit", () => {
      const generateLength = (num?: number) =>
        num === undefined ? undefined : Array(num).fill("a").join("");
      for (const chatLabel of [undefined, 0, LABEL_MIN - 1, LABEL_MIN, LABEL_MIN + 1].map(
        generateLength
      )) {
        const result = createChatSchema.safeParse({ participants: ["one", "two"], chatLabel });
        if (!chatLabel || !chatLabel.length || chatLabel.length >= LABEL_MIN) {
          expect(result.success).toBeTruthy();
          continue;
        }

        throwOnTruthy(result.success);
        const { path, message } = result.error.errors[0];
        expect(path[0]).toBe("chatLabel");
        expect(message).toBe(errorMessages.underMin(LABEL_MIN));
      }
    });
    it("Transforms empty chatLabel string to undefined", () => {
      expect(createChatSchema.safeParse({ participants: ["one"], chatLabel: "" }).data).toEqual({
        participants: ["one"],
        chatLabel: undefined
      });
    });
  });
}
