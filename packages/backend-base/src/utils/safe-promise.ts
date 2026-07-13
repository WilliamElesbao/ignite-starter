/**
 * Utility function to safely handle promises without try/catch blocks.
 *
 * @param promise - The promise to be handled.
 * @returns A tuple where the first element is the resolved value (or null if rejected) and the second element is the error (or null if resolved).
 */
export const safePromise = async <T>(
  promise: Promise<T>,
): Promise<[T, null] | [null, Error]> => {
  try {
    const value = await promise;
    return [value, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
};
