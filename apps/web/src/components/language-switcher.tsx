"use client";

import { Languages } from "lucide-react";
import { usePathname as useNextPathname } from "next/navigation";
import { hasLocale, useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocaleLabel } from "@/hooks/locale/useLocale";
import { useRouter } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("common");

  const localeFromContext = useLocale();
  const locale = hasLocale(routing.locales, localeFromContext)
    ? localeFromContext
    : routing.defaultLocale;
  const pathname = useNextPathname();
  const router = useRouter();

  const localePrefixPattern = new RegExp(
    `^/(${routing.locales.map((value) => value.replace("-", "\\-")).join("|")})(?=/|$)`,
  );
  const pathnameWithoutLocale =
    pathname.replace(localePrefixPattern, "") || "/";

  const getLocaleLabel = useLocaleLabel();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="size-4" />
          <span className="sr-only">{t("change-language")}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {routing.locales.map((nextLocale) => (
          <DropdownMenuItem
            key={nextLocale}
            onClick={() => {
              router.replace(pathnameWithoutLocale, { locale: nextLocale });
            }}
          >
            {getLocaleLabel(nextLocale)}
            {locale === nextLocale ? " ✓" : ""}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
