import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

interface AuthFormSubmitProps {
  children: React.ReactNode;
}

export const AuthFormSubmit = ({ children }: AuthFormSubmitProps) => {
  return (
    <Field>
      <Button type="submit" className="text-foreground">
        {children}
      </Button>
    </Field>
  );
};
