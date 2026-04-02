import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { WELCOME_TOAST } from "@/constants";
import { authClient } from "@/lib/better-auth/auth-client";
import { type SignUpFormValues, signUpFormSchema } from "./form.schema";

export const useSignUpForm = () => {
  const t = useTranslations("sign-up");

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema()),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (values: SignUpFormValues) => {
    sessionStorage.setItem(WELCOME_TOAST.key, WELCOME_TOAST.value);

    await authClient.signUp.email(
      {
        ...values,
        callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}`,
      },
      {
        onSuccess: (context) => {
          console.log("[useSignupForm] - Sign-up successful:", context.data);
          window.location.replace("/");
        },
        onError: (context) => {
          toast.error(`${t("toast.sign-up-failed")}: ${context.error.message}`);
        },
      },
    );
  };

  return { form, onSubmit };
};
