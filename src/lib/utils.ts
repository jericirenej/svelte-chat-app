import type { ParticipantData } from "../types";
export const promisifiedTimeout = async (timeout: number) =>
  new Promise((resolve) => setTimeout(resolve, timeout));

type TimeoutReturn = ReturnType<typeof setTimeout>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounce = <F extends (...args: any[]) => ReturnType<F>>(
  callback: F,
  timeout: number
) => {
  let timer: TimeoutReturn | undefined;

  return (...args: Parameters<F>) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback(...args);
    }, timeout);
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const throttle = <F extends (...args: any[]) => ReturnType<F>>(
  callback: F,
  timeout: number
) => {
  let inThrottle: boolean = false,
    lastTime = Date.now(),
    lastFn: TimeoutReturn | undefined;
  return (...args: Parameters<F>) => {
    if (!inThrottle) {
      callback(...args);
      lastTime = Date.now();
      inThrottle = true;
      return;
    }
    clearTimeout(lastFn);
    const now = Date.now();
    lastFn = setTimeout(
      () => {
        const diff = now - lastTime;
        if (diff >= timeout) {
          callback(...args);
          lastTime = now;
        }
      },
      Math.max(timeout - (now - lastTime), 0)
    );
  };
};

export const secureCookieEval = (url: URL): boolean =>
  url.hostname === "localhost" || url.protocol === "https";

export const participantName = ({ name, surname, username }: ParticipantData): string => {
  const val = [name, surname].filter(Boolean).join(" ");
  return val ? val : username;
};

export function throwOnTruthy(val: boolean): asserts val is false {
  if (val) {
    throw new Error("Should have been falsy!");
  }
}
