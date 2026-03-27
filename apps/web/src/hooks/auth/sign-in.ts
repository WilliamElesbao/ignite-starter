import { authClient } from "@/lib/better-auth/auth-client";

/**
 * Function to trigger Google Sign In flow.
 * This function redirects the user to Google's OAuth.
 */
export const signIn = async () => {
  try {
    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/?welcome=true`,
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
