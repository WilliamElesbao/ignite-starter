import type { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

const LOCALE_PATTERN = /^\/(en|pt-BR)(?=\/|$)/;

export const handleI18nRouting = createMiddleware(routing);

export function resolveLocale(request: NextRequest, response: NextResponse) {
  const rewritten = response.headers.get("x-middleware-rewrite") ?? request.url;
  const pathname = new URL(rewritten).pathname;
  const localeMatch = pathname.match(LOCALE_PATTERN);
  const locale = localeMatch?.[1] ?? routing.defaultLocale;
  const pathnameWithoutLocale = pathname.replace(LOCALE_PATTERN, "") || "/";

  return { locale, pathnameWithoutLocale };
}
