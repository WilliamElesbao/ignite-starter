import { useTranslations } from "next-intl";
import { FieldSeparator } from "@/components/ui/field";

export const AuthFormSeparator = () => {
  const t = useTranslations("common");

  return <FieldSeparator>{t("or")}</FieldSeparator>;
};
