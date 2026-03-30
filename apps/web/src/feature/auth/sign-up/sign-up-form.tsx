"use client";

import { AuthForm } from "@/feature/auth/components";
import { cn } from "@/lib/shadcn/utils";
import { signInWithGoogle } from "../hooks";
import { useSignupForm } from "./hooks/useSignupForm";

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { form, onSubmit } = useSignupForm();

  return (
    <AuthForm className={cn(className)} {...props}>
      <AuthForm.Form form={form} onSubmit={onSubmit}>
        <AuthForm.Header mode="sign-up" />
        <AuthForm.Field
          form={form}
          name="name"
          label="Name"
          placeholder="John Doe"
        />
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
        <AuthForm.Submit>Create Account</AuthForm.Submit>
        <AuthForm.Separator />
        <AuthForm.Socials signInWithGoogle={signInWithGoogle} />
      </AuthForm.Form>
    </AuthForm>
  );
}
