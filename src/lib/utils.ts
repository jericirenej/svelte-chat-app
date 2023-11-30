export const promisifiedTimeout = async (timeout: number) =>
  new Promise((resolve) => setTimeout(resolve, timeout));

export const debounce = <F extends (...args: unknown[]) => ReturnType<F>>(
  callback: F,
  timeout: number
) => {
  let timer: NodeJS.Timeout;

  return (...args: Parameters<F>) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback(...args);
    }, timeout);
  };
};
