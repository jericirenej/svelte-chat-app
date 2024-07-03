import type { EntitySize } from "../../types";

export const sizeVariants = ["xs", "sm", "base", "lg", "xl"] satisfies Exclude<
  EntitySize,
  "number"
>[];

export const sizeMap: Record<Exclude<EntitySize, "number">, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl"
};

export const sizeArgTypes = {
  sizeVariant: {
    control: "radio",
    options: sizeVariants,
    description: `Size property can be given as one of the ${sizeVariants.join(", ")} keywords.`
  },
  sizeNumber: { control: "number", description: "Size prop can also be given as a number" },
  size: { table: { disable: true } }
} as const;
