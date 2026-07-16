import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { getSessionAction } from "@/action/get-session.action";
import { clearAuthCookies } from "./cookies";

// Routes that require no authentication
const AUTH_ROUTES = new Set(["/sign-in", "/sign-up"]);

// Landing page — public for unauthenticated, redirects to app for authenticated
const LANDING_ROUTE = "/";

// Only these prefixes are protected — everything else falls through
const PROTECTED_PREFIXES = ["/subscription"];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.has(pathname);
}

function isLandingRoute(pathname: string): boolean {
  return pathname === LANDING_ROUTE;
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function redirectTo(path: string, request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function handleAuth(
  request: NextRequest,
  response: NextResponse,
  locale: string,
  pathname: string,
): Promise<NextResponse> {
  const sessionToken = getSessionCookie(request);

  // ── Unauthenticated ──────────────────────────────────────────────────────
  if (!sessionToken) {
    // Landing page and auth routes are always accessible without a session
    if (isLandingRoute(pathname) || isAuthRoute(pathname)) return response;

    // Protected workspace routes require a session
    if (isProtectedRoute(pathname)) {
      return redirectTo(`/${locale}/sign-in`, request);
    }

    // Any other unknown route falls through (avoids over-eager redirects)
    return response;
  }

  // ── Has a token — validate it ────────────────────────────────────────────
  const data = await getSessionAction();
  const session = data?.session;

  if (!session) {
    const redirect = redirectTo(`/${locale}/sign-in`, request);
    clearAuthCookies(redirect);
    return redirect;
  }

  // ── Authenticated ────────────────────────────────────────────────────────
  // Landing page and auth routes redirect to the app for signed-in users
  if (isAuthRoute(pathname)) {
    return redirectTo(`/${locale}/subscription`, request);
  }

  return response;
}
