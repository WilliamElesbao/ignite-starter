import { postEmailSendMutation } from "@repo/api/";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

/**
 * Hook for sending emails via the backend API.
 *
 * @returns React Query mutation hook for email sending operations
 */
export const useSendEmail = () => {
  const t = useTranslations("send-email");

  const mutation = useMutation({
    ...postEmailSendMutation(),
    onSuccess: () => {
      toast.success(t("email-sent-successfully"));
    },
    onError: () => {
      toast.error(t("failed-to-send-email"));
    },
  });
  return { ...mutation };
};
