import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "./cookies";

const AUTH_ROUTES = new Set(["/sign-in", "/sign-up"]);

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.has(pathname);
}

export async function getSessionFromAPI(request: NextRequest) {
  const res = await fetch(`${process.env.API_URL}/auth/get-session`, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export function redirectTo(path: string, request: NextRequest) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function handleAuth(
  request: NextRequest,
  response: NextResponse,
  locale: string,
  pathname: string,
) {
  const sessionToken = getSessionCookie(request);
  const authRoute = isAuthRoute(pathname);

  if (!sessionToken) {
    if (!authRoute) {
      return redirectTo(`/${locale}/sign-in`, request);
    }

    return response;
  }

  const session = await getSessionFromAPI(request);

  if (!session) {
    const redirectResponse = redirectTo(`/${locale}/sign-in`, request);
    clearAuthCookies(redirectResponse);
    return redirectResponse;
  }

  if (authRoute) {
    return redirectTo(`/${locale}`, request);
  }

  return response;
}
