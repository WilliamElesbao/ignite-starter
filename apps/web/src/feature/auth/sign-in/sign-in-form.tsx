"use client";

import { useTranslations } from "next-intl";
import { AuthForm } from "@/feature/auth/components";
import { useSignInForm } from "@/feature/auth/sign-in/hooks/useSignInForm";
import { cn } from "@/lib/shadcn/utils";
import { signInWithGoogle } from "../hooks/sign-in";

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("common");
  const { form, onSubmit } = useSignInForm();

  return (
    <AuthForm className={cn(className)} {...props}>
      <AuthForm.Form form={form} onSubmit={onSubmit}>
        <AuthForm.Header mode="sign-in" />
        <AuthForm.Field
          form={form}
          name="email"
          label={t("email")}
          type="email"
          placeholder="ignite@starter.com"
        />
        <AuthForm.Field
          form={form}
          name="password"
          label={t("password")}
          type="password"
          placeholder="••••••••"
        />
        <AuthForm.Submit>{t("login")}</AuthForm.Submit>
        <AuthForm.Separator />
        <AuthForm.Socials signInWithGoogle={signInWithGoogle} />
      </AuthForm.Form>
      <AuthForm.Description />
    </AuthForm>
  );
}
