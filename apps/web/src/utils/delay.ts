/**
 * Creates a promise that resolves after a specified delay.
 *
 * @param seconds - Number of seconds to delay
 * @returns Promise that resolves after the delay
 */
export const delay = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));
