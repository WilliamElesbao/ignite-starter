import type z from "zod";
import { safePromise } from "./safe-promise";

type FetchError =
  | { type: "network"; cause: unknown }
  | { type: "http"; status: number; statusText: string }
  | { type: "parse"; cause: unknown }
  | { type: "validation"; cause: z.ZodError };

type SafeFetchResult<T> =
  | { success: true; data: T }
  | { success: false; error: FetchError };

export interface SafeFetchOptions {
  onError?: (error: FetchError) => void;
}

export async function safeFetch<T>(
  input: RequestInfo,
  schema: z.ZodSchema<T>,
  init?: RequestInit,
  options?: SafeFetchOptions,
): Promise<SafeFetchResult<T>> {
  const report = (error: FetchError): SafeFetchResult<T> => {
    options?.onError?.(error);
    return { success: false, error };
  };

  const [res, networkErr] = await safePromise(fetch(input, init));

  if (networkErr) {
    return report({ type: "network", cause: networkErr });
  }

  if (!res.ok) {
    return report({
      type: "http",
      status: res.status,
      statusText: res.statusText,
    });
  }

  const [json, parseErr] = await safePromise(res.json());

  if (parseErr) {
    return report({ type: "parse", cause: parseErr });
  }

  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return report({ type: "validation", cause: parsed.error });
  }

  return { success: true, data: parsed.data };
}
