import { useEffect } from "react";
import { toast } from "sonner";
import { WELCOME_TOAST } from "@/constants";

/**
 * Custom hook to show a welcome toast after successful authentication.
 * It checks for a specific key in sessionStorage to determine if the toast should be shown.
 * After showing the toast, it removes the key from sessionStorage to prevent it from showing again.
 */
export const useWelcomeToast = () => {
  useEffect(() => {
    const shouldShow =
      sessionStorage.getItem(WELCOME_TOAST.key) === WELCOME_TOAST.value;

    if (!shouldShow) return;

    setTimeout(() => {
      toast.success("Hey d3v!", {
        description:
          "Welcome to Ignite Starter, Wow, the authentication worked perfectly!",
        position: "top-center",
      });

      sessionStorage.removeItem(WELCOME_TOAST.key);
    }, 0);
  }, []);
};
