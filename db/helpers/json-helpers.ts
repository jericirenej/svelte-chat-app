const REPLACER_MARK = "__jsonReplacer",
  REPLACER_VAL_PROP = "__jsonValue";
const REPLACER_PROPS = [REPLACER_MARK, REPLACER_VAL_PROP];
export function jsonReplacer(key: string, value: unknown) {
  if (REPLACER_PROPS.includes(key)) return value;
  if (value === null) {
    return { [REPLACER_MARK]: "null", [REPLACER_VAL_PROP]: "null" };
  }
  if (typeof value === "string" && /^\d+/.test(value) && !Number.isNaN(new Date(value).getTime())) {
    return { [REPLACER_MARK]: "date", [REPLACER_VAL_PROP]: value };
  }
  return value;
}

export const jsonReviver = (key: string, value: unknown) => {
  if (!(typeof value === "object" && value !== null)) return value;
  if (!(REPLACER_MARK in value && REPLACER_VAL_PROP in value)) return value;
  if (value[REPLACER_MARK] === "date") return new Date(value[REPLACER_VAL_PROP] as string);
  if (value[REPLACER_MARK] === "null") return null;
  return value;
};

export const typedJsonParse = <T>(
  stringified: string,
  reviver: Parameters<typeof JSON.parse>[1]
): T => JSON.parse(stringified, reviver) as T;

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest;
  describe("jsonReplacer and reviver", () => {
    it("Should allow proper encoding and decoding of nulls and datesd", () => {
      const stringAndNumArray = ["string", 1, "alsoString", 2];

      for (const example of [
        stringAndNumArray,
        [...stringAndNumArray, new Date(), null],
        { name: null, birthdate: new Date(), surname: "surname" },
        null,
        new Date("2020-01-01")
      ]) {
        const stringified = JSON.stringify(example, jsonReplacer);
        const parsed = typedJsonParse<unknown>(stringified, jsonReviver);
        expect(parsed).toEqual(example);
      }
    });
  });
}
