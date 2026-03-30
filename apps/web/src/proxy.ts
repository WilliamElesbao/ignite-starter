import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authRoutes = new Set(["/sign-in", "/sign-up"]);

  try {
    const cookie = getSessionCookie(request);
    const isAuthenticated = Boolean(cookie);
    const isAuthRoute = authRoutes.has(pathname);

    if (!isAuthenticated && !isAuthRoute) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (isAuthenticated && isAuthRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("[middleware] Error getting session:", error);
    return NextResponse.redirect(new URL("/sign-in", request.url));
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
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
