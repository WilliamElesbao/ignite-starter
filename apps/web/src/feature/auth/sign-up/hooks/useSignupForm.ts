import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { signUpWithEmail } from "@/feature/auth/hooks";
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
    await signUpWithEmail(values, t("toast.sign-up-failed"));
  };

  return { form, onSubmit };
};
