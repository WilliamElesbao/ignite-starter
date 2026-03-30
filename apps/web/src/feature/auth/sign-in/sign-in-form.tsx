"use client";

import { AuthForm } from "@/feature/auth/components";
import { signInWithGoogle } from "@/feature/auth/hooks";
import { useSignInForm } from "@/feature/auth/sign-in/hooks/useSignInForm";
import { cn } from "@/lib/shadcn/utils";

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { form, onSubmit } = useSignInForm();

  return (
    <AuthForm className={cn(className)} {...props}>
      <AuthForm.Form form={form} onSubmit={onSubmit}>
        <AuthForm.Header mode="sign-in" />
        <AuthForm.Field
          form={form}
          name="email"
          label="Email"
          type="email"
          placeholder="m@example.com"
        />
        <AuthForm.Field
          form={form}
          name="password"
          label="Password"
          type="password"
          placeholder="••••••••"
        />
        <AuthForm.Submit>Login</AuthForm.Submit>
        <AuthForm.Separator />
        <AuthForm.Socials signInWithGoogle={signInWithGoogle} />
      </AuthForm.Form>
      <AuthForm.Description />
    </AuthForm>
  );
}
