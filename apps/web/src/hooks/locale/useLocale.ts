import { useTranslations } from "next-intl";
import type { routing } from "@/lib/i18n/routing";

type Locale = (typeof routing.locales)[number];

export const useLocaleLabel = () => {
  const t = useTranslations("languages");

  return (locale: Locale) =>
    ({
      en: t("en"),
      "pt-BR": t("pt-BR"),
    })[locale];
};
