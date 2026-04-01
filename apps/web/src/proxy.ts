import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// Cookies set by BetterAuth that must be cleared when a session is invalidated.
const BETTER_AUTH_COOKIES = [
  "better-auth.session_token",
  "better-auth.session_data", // written when cookieCache is enabled
];

export async function proxy(request: NextRequest) {
  const authRoutes = new Set(["/sign-in", "/sign-up"]);
  const response = handleI18nRouting(request);

  if (!response.ok) {
    return response;
  }

  const rewritten = response.headers.get("x-middleware-rewrite") ?? request.url;
  const pathname = new URL(rewritten).pathname;
  const localeMatch = pathname.match(/^\/(en|pt-BR)(?=\/|$)/);
  const locale = localeMatch?.[1] ?? routing.defaultLocale;
  const pathnameWithoutLocale =
    pathname.replace(/^\/(en|pt-BR)(?=\/|$)/, "") || "/";

  try {
    const sessionToken = getSessionCookie(request);
    const isAuthRoute = authRoutes.has(pathnameWithoutLocale);

    if (!sessionToken) {
      if (!isAuthRoute) {
        return NextResponse.redirect(
          new URL(`/${locale}/sign-in`, request.url),
        );
      }
      return response;
    }

    // Cookie exists — verify with the backend that the session is still valid.
    // Checking only cookie presence is insufficient: the token may still be in
    // the browser after it has been evicted from Redis or the database, which
    // causes an infinite redirect loop between the dashboard (→ /sign-in) and
    // this middleware (→ /) because both sides disagree on auth state.
    const res = await fetch(`${process.env.API_URL}/auth/get-session`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });

    const session = res.ok ? await res.json() : null;

    if (!session) {
      // Backend no longer recognises this session. Delete the stale cookies so
      // the next request is treated as unauthenticated, then go to sign-in.
      const redirectResponse = NextResponse.redirect(
        new URL(`/${locale}/sign-in`, request.url),
      );
      for (const name of BETTER_AUTH_COOKIES) {
        redirectResponse.cookies.delete(name);
      }
      return redirectResponse;
    }

    if (isAuthRoute) {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    return response;
  } catch (error) {
    console.error("[middleware] Error getting session:", error);
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};
