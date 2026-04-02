import type { NextRequest } from "next/server";
import {
  handleAuth,
  handleI18nRouting,
  redirectTo,
  resolveLocale,
} from "@/middleware";

export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  if (!response.ok) {
    return response;
  }

  const { locale, pathnameWithoutLocale } = resolveLocale(request, response);

  try {
    return await handleAuth(request, response, locale, pathnameWithoutLocale);
  } catch (error) {
    console.error("[middleware] Error getting session:", error);
    return redirectTo(`/${locale}/sign-in`, request);
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
