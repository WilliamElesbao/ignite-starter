import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { WELCOME_TOAST } from "@/constants";
import { authClient } from "@/lib/better-auth/auth-client";
import { type SignInFormValues, signInFormSchema } from "./form.schema";

export const useSignInForm = () => {
  const t = useTranslations("sign-in");

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema()),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (values: SignInFormValues) => {
    // await signInWithEmail(values);
    sessionStorage.setItem(WELCOME_TOAST.key, WELCOME_TOAST.value);

    await authClient.signIn.email(
      {
        ...values,
        callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}`,
      },
      {
        onError: (context) => {
          toast.error(t("toast.login-failed"), {
            description: context.error.message,
          });
        },
      },
    );
  };

  return { form, onSubmit };
};
