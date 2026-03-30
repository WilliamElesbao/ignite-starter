import { FieldDescription } from "@/components/ui/field";

interface AuthFormDescriptionProps {
  children?: React.ReactNode;
  className?: string;
}

export const AuthFormDescription = ({
  children,
  className,
}: AuthFormDescriptionProps) => {
  return (
    <FieldDescription className={className ?? "px-6 text-center"}>
      {children ??
        "This project is an open-source starter kit built for developers who want to accelerate product development with best practices. By clicking continue, you'll unlock the features of this developer-friendly open-source starter."}
    </FieldDescription>
  );
};
