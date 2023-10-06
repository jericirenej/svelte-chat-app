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
