import { useTranslations } from "next-intl";
import type { routing } from "@/lib/i18n/routing";

type Locale = (typeof routing.locales)[number];

/**
 * Returns a function that maps locale codes to their translated display labels.
 *
 * @returns Function that accepts a locale code and returns its translated label
 */
export const useLocaleLabel = () => {
  const t = useTranslations("languages");

  return (locale: Locale) =>
    ({
      en: t("en"),
      "pt-BR": t("pt-BR"),
    })[locale];
};
