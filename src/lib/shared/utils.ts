export const promisifiedTimeout = async (timeout: number) =>
  new Promise((resolve) => setTimeout(resolve, timeout));
