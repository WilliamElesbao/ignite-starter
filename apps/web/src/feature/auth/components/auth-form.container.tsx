import { FieldGroup } from "@repo/ui/components/ui/field";
import { Form } from "@repo/ui/components/ui/form";
import type {
  FieldValues,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";

interface AuthFormContainerProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
}

export const AuthFormContainer = <T extends FieldValues>({
  form,
  onSubmit,
  children,
}: AuthFormContainerProps<T>) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>{children}</FieldGroup>
      </form>
    </Form>
  );
};
