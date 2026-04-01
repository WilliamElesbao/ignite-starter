"use client";

import { useTranslations } from "next-intl";
import { AuthForm } from "@/feature/auth/components";
import { cn } from "@/lib/shadcn/utils";
import { signInWithGoogle } from "../hooks";
import { useSignupForm } from "./hooks/useSignupForm";

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations();
  const { form, onSubmit } = useSignupForm();

  return (
    <AuthForm className={cn(className)} {...props}>
      <AuthForm.Form form={form} onSubmit={onSubmit}>
        <AuthForm.Header mode="sign-up" />
        <AuthForm.Field
          form={form}
          name="name"
          label={t("common.name")}
          placeholder="Ignite Starter"
        />
        <AuthForm.Field
          form={form}
          name="email"
          label={t("common.email")}
          type="email"
          placeholder="ignite@starter.com"
        />
        <AuthForm.Field
          form={form}
          name="password"
          label={t("common.password")}
          type="password"
          placeholder="••••••••"
        />
        <AuthForm.Submit>{t("sign-up.create-account")}</AuthForm.Submit>
        <AuthForm.Separator />
        <AuthForm.Socials signInWithGoogle={signInWithGoogle} />
      </AuthForm.Form>
    </AuthForm>
  );
}
