import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { safePromise } from "@/utils";
import { useSendEmail } from "./email.mutation";

/**
 * Hook for sending welcome emails with toast notifications.
 * 
 * @returns Object containing sendWelcomeEmail function
 */
export const useEmail = () => {
  const t = useTranslations("dashboard.toast.send-email");
  const { mutateAsync } = useSendEmail();

  const sendWelcomeEmail = async () => {
    const [response, error] = await safePromise(mutateAsync({}));

    if (!response?.success || error) {
      toast.error(t("failed-to-send-email"));
      return;
    }

    if (response.success) {
      toast.success(t("email-sent-successfully"));
    }
  };

  return { sendWelcomeEmail };
};
