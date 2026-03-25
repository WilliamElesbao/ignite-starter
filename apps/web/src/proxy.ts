import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {
  try {
    const cookie = getSessionCookie(request);
    console.log("[middleware][cookie]:", cookie);

    if (!cookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch (error) {
    console.error("[middleware] Error getting session:", error);
    return NextResponse.redirect(new URL("/login", request.url));
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
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login).*)",
  ],
};
