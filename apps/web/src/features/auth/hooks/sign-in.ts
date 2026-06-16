import { toast } from "sonner";
import { WELCOME_TOAST } from "@/constants";
import { authClient } from "@/lib/better-auth/auth-client";

/**
 * Initiates Google OAuth sign-in flow and sets welcome toast flag.
 *
 * @returns Promise that resolves when sign-in is initiated
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
          toast.error("Google sign-in failed", {
            description: context.error.message,
          });
        },
      },
    );
  } catch (error) {
    console.error("[signIn] error:", error);
    throw error;
  }
};
