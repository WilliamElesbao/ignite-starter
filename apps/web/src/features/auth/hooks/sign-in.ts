import { toast } from "sonner";
import { authClient } from "@/lib/better-auth/auth-client";
import { logger } from "@/utils/logger";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

/**
 * Initiates Google OAuth sign-in flow and sets welcome toast flag.
 *
 * @returns Promise that resolves when sign-in is initiated
 */
export const signInWithGoogle = async () => {
  const { error } = await authClient.signIn.social(
    {
      provider: "google",
      callbackURL: `${baseUrl}/subscription`,
    },
    {
      onError: (context) => {
        toast.error("Google sign-in failed", {
          description: context.error.message,
        });
      },
    },
  );

  if (error) {
    logger.error("[signIn] error:", error);
    throw error;
  }
};
