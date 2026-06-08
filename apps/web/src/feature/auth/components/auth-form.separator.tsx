import { FieldSeparator } from "@repo/ui/components/ui/field";
import { useTranslations } from "next-intl";

export const AuthFormSeparator = () => {
  const t = useTranslations("common");

  return <FieldSeparator>{t("or")}</FieldSeparator>;
};
