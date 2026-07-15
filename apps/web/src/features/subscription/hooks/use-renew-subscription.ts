import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { renewSubscriptionAction } from "../actions/manage-subscription.action";

export function useRenewSubscription() {
  const t = useTranslations("plans");

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await renewSubscriptionAction();
      if (!result.success) throw new Error(result.error);

      return result;
    },
    onSuccess: () => {
      toast.success(t("renew.subscription-renewed"), {
        description: t(
          "renew.your-pro-access-subscription-will-continue-normally",
        ),
      });
    },
    onError: (err) => {
      toast.error(t("renew.failed-to-renew"), {
        description:
          err instanceof Error ? err.message : t("renew.please-try-again"),
      });
    },
  });

  return { ...mutation };
}
