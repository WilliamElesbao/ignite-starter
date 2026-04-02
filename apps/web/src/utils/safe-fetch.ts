import type z from "zod";
import { safePromise } from "./safe-promise";

/**
 * Utility function to perform a fetch request and validate the response against a Zod schema.
 *
 * @param input - The resource that you wish to fetch.
 * @param init - An object containing any custom settings that you want to apply to the request.
 * @param schema - A Zod schema to validate the response against.
 * @returns The parsed response if successful, or null if there was an error or validation failed.
 */
export async function safeFetch<T>(
  input: RequestInfo,
  init: RequestInit,
  schema: z.ZodSchema<T>,
): Promise<T | null> {
  const [res, err] = await safePromise(fetch(input, init));

  if (err) {
    console.error("Fetch error:", err);
    return null;
  }

  const [json, jsonErr] = await safePromise(res.json());

  if (jsonErr) {
    console.error("JSON parse error:", jsonErr);
    return null;
  }

  const parsed = schema.safeParse(json);

  return parsed.success ? parsed.data : null;
}
