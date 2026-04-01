import { useTranslations } from "next-intl";
import z from "zod";

const MIN_NAME_LENGTH = 5;
const MIN_PASSWORD_LENGTH = 8;

export const signUpFormSchema = () => {
  const t = useTranslations("validation");

  return z.object({
    name: z.string().min(MIN_NAME_LENGTH, {
      error: t("name.min-length", { min: String(MIN_NAME_LENGTH) }),
    }),
    email: z.email({ error: t("email.please-enter-a-valid-email") }),
    password: z.string().min(MIN_PASSWORD_LENGTH, {
      error: t("password.min-length", { min: String(MIN_PASSWORD_LENGTH) }),
    }),
  });
};

export type SignUpFormValues = z.infer<ReturnType<typeof signUpFormSchema>>;
