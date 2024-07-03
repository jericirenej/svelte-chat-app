import type { MaybeArray, Nullish } from "../types";

export const capitalize = (str: string): string => `${str[0].toLocaleUpperCase()}${str.slice(1)}`;

export const toArray = <T>(arg: MaybeArray<T>): T[] => (Array.isArray(arg) ? arg : [arg]);

export const isNullish = (arg: unknown): arg is Nullish => arg === undefined || arg === null;
