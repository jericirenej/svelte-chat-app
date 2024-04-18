export type PbkdfSettings = {
  iterations: number;
  keylen: number;
  randomBytesLength: number;
  digest: string;
  toStringType: BufferEncoding;
};

export type RemoveIndexSignature<T extends Record<string, unknown>> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};
export type NotificationTypes = "default" | "secondary" | "failure";
export type NotificationEntry = {
  content: string;
  action?: () => unknown;
  type?: NotificationTypes;
  lifespan?: number;
};

export type MaybeArray<T> = T | T[];
export type Nullish = undefined | null;
