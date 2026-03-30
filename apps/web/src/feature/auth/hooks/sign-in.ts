import { toast } from "sonner";
import { WELCOME_TOAST } from "@/constants";
import type { SignInFormValues } from "@/feature/auth/sign-in/hooks/form.schema";
import { authClient } from "@/lib/better-auth";

/**
 * Function to trigger Google Sign In flow.
 * This function redirects the user to Google's OAuth.
 */
export const signInWithGoogle = async () => {
  try {
    sessionStorage.setItem(WELCOME_TOAST.key, WELCOME_TOAST.value);

    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}`,
      },
      {
        onError: (context) => {
          console.error(
            "[signIn] - Error during sign-in:",
            context.error.message,
          );
        },
      },
    );
  } catch (error) {
    console.error("[signIn] error:", error);
    throw error;
  }
};

export const signInWithEmail = async (values: SignInFormValues) => {
  sessionStorage.setItem(WELCOME_TOAST.key, WELCOME_TOAST.value);

  await authClient.signIn.email(
    {
      ...values,
      callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}`,
    },
    {
      onError: (context) => {
        toast.error("Login failed", {
          description: context.error.message,
        });
      },
    },
  );
};
