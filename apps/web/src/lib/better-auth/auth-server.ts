import type { GetSessionResponse } from "@repo/api/generated/api/types.gen";
import { cookies } from "next/headers";
import { safePromise } from "@/utils/safe-promise";

export type User = NonNullable<GetSessionResponse>["user"];

export async function getSession(): Promise<GetSessionResponse> {
  const cookieStore = await cookies();

  const [res, err] = await safePromise(
    fetch(`${process.env.API_URL}/auth/get-session`, {
      headers: { Cookie: cookieStore.toString() },
    }),
  );

  if (err || !res.ok) {
    console.error("Fetch error:", err);
    return null;
  }

  const [json, jsonErr] = await safePromise(res.json());

  if (jsonErr) {
    console.error("JSON parse error:", jsonErr);
    return null;
  }

  const data = json as GetSessionResponse; // Assuming the API response matches the SessionResponse type

  if (!data) {
    console.error("Invalid session data:", data);
    return null;
  }

  return data;
}
