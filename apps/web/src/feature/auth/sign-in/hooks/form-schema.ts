import { useTranslations } from "next-intl";
import z from "zod";

export const signInFormSchema = () => {
  const t = useTranslations("validation");

  return z.object({
    email: z.email({ error: t("email.please-enter-a-valid-email") }),
    password: z.string().min(1, { error: t("password.password-is-required") }),
  });
};

export type SignInFormValues = z.infer<ReturnType<typeof signInFormSchema>>;
