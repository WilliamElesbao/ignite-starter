import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { WELCOME_TOAST } from "@/constants";

/**
 * Custom hook to show a welcome toast after successful authentication.
 * It checks for a specific key in sessionStorage to determine if the toast should be shown.
 * After showing the toast, it removes the key from sessionStorage to prevent it from showing again.
 */
export const useWelcomeToast = () => {
  const t = useTranslations("dashboard");

  useEffect(() => {
    const shouldShow =
      sessionStorage.getItem(WELCOME_TOAST.key) === WELCOME_TOAST.value;

    if (!shouldShow) return;

    setTimeout(() => {
      toast.success(t("toast.welcome.title"), {
        description: t("toast.welcome.description"),
        position: "top-center",
      });

      sessionStorage.removeItem(WELCOME_TOAST.key);
    }, 0);
  }, [t]);
};
