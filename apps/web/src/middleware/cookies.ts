import type { NextResponse } from "next/server";

const BETTER_AUTH_COOKIES = [
  "better-auth.session_token",
  "better-auth.session_data",
];

export function clearAuthCookies(response: NextResponse) {
  for (const name of BETTER_AUTH_COOKIES) {
    response.cookies.delete(name);
  }
}
