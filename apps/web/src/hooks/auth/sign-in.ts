import { authClient } from "@/lib/better-auth/auth-client";

/**
 * Function to trigger Google Sign In flow.
 * This function redirects the user to Google's OAuth.
 */
export const signIn = async () => {
  try {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/?welcome=true",
    });
  } catch (error) {
    console.error("[signIn] error:", error);
    throw error;
  }
};
