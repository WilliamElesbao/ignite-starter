import { useTranslations } from "next-intl";
import { FieldDescription } from "@/components/ui/field";

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
