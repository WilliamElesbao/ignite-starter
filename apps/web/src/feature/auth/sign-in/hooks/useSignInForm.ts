import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signInWithEmail } from "@/feature/auth/hooks";
import { type SignInFormValues, signInFormSchema } from "./form.schema";

export const useSignInForm = () => {
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (values: SignInFormValues) => {
    await signInWithEmail(values);
  };

  return { form, onSubmit };
};
