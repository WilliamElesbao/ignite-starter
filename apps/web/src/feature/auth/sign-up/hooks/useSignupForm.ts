import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signUpWithEmail } from "@/feature/auth/hooks";
import { type SignUpFormValues, signUpFormSchema } from "./form.schema";

export const useSignupForm = () => {
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
    await signUpWithEmail(values);
  };

  return { form, onSubmit };
};
