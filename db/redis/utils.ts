export function jsonReplacer(this: Record<string, unknown>, key: string, value: unknown) {
  if (value === null) {
    return { __jsonType: "null", value: "null" };
  }
  if (this[key] instanceof Date) {
    return { __jsonType: "date", value: value };
  }
  return value;
}

export const jsonReviver = (key: string, value: unknown) => {
  if (!(typeof value === "object" && value !== null)) return value;
  if (!("__jsonType" in value && "value" in value)) return value;
  if (value.__jsonType === "date") return new Date(value.value as string);
  if (value.__jsonType === "null") return null;
  return value;
};
