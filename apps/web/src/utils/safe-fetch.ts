import type z from "zod";
import { safePromise } from "./safe-promise";

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
