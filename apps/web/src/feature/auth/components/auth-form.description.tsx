import { FieldDescription } from "@repo/ui/components/ui/field";
import { useTranslations } from "next-intl";

interface AuthFormDescriptionProps {
  children?: React.ReactNode;
  className?: string;
}

export const AuthFormDescription = ({
  children,
  className,
}: AuthFormDescriptionProps) => {
  const t = useTranslations("sign-in");

  return (
    <FieldDescription className={className ?? "px-6 text-center"}>
      {children ?? t("project-description")}
    </FieldDescription>
  );
};
