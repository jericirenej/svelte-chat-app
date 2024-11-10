import { throwOnTruthy } from "$lib/utils";
import { z } from "zod";
import { LENGTH_ERR_MESSAGES } from "../../messages";

const LABEL_MIN = 5,
  PARTICIPANTS_MIN = 2;
const errorMessages = {
  participants: "Chat must have at least two participants",
  ...LENGTH_ERR_MESSAGES
};

const participants = (msg?: string) =>
  z.array(z.string()).min(PARTICIPANTS_MIN, msg ?? errorMessages.participants);
const chatLabel = (msg?: string) =>
  z
    .string()
    .min(LABEL_MIN, msg ?? errorMessages.underMin(LABEL_MIN))
    .optional();

export const createChatSchema = z.object({ participants: participants(), chatLabel: chatLabel() });

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  describe("CreateChatValidator", () => {
    it("Throws if less than 2 participants", () => {
      for (const participants of [[], ["one"], ["one", "two"], ["one", "two", "three"]]) {
        const result = createChatSchema.safeParse({ participants });
        if (participants.length < PARTICIPANTS_MIN) {
          throwOnTruthy(result.success);
          expect(result.error.errors).toHaveLength(1);
          const { path, message } = result.error.errors[0];
          expect(path[0]).toBe("participants");
          expect(message).toBe(errorMessages.participants);
          continue;
        }
        expect(result.success).toBeTruthy();
      }
    });
    it("Throws if chat label is under limit", () => {
      const generateLength = (num: number) => Array(num).fill("a").join("");
      for (const chatLabel of [LABEL_MIN - 1, LABEL_MIN, LABEL_MIN + 1].map(generateLength)) {
        const result = createChatSchema.safeParse({ participants: ["one", "two"], chatLabel });
        if (chatLabel.length < LABEL_MIN) {
          throwOnTruthy(result.success);
          const { path, message } = result.error.errors[0];
          expect(path[0]).toBe("chatLabel");
          expect(message).toBe(errorMessages.underMin(LABEL_MIN));
          continue;
        }
        expect(result.success).toBeTruthy();
      }
    });
  });
}
