import { toast } from "sonner";
import { WELCOME_TOAST } from "@/constants";
import type { SignUpFormValues } from "@/feature/auth/sign-up/hooks/form.schema";
import { authClient } from "@/lib/better-auth";

/**
 * Handles user sign-up by calling the authentication client's email sign-up method.
 * Displays a welcome toast on successful sign-up and an error toast on failure.
 *
 * @param values - The sign-up form values containing name, email, and password.
 */
export const signUpWithEmail = async (values: SignUpFormValues) => {
  sessionStorage.setItem(WELCOME_TOAST.key, WELCOME_TOAST.value);

  await authClient.signUp.email(
    {
      ...values,
      callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}`,
    },
    {
      onSuccess: (context) => {
        console.log("[useSignupForm] - Sign-up successful:", context.data);
      },
      onError: (context) => {
        toast.error(`Sign-up failed: ${context.error.message}`);
      },
    },
  );
};
