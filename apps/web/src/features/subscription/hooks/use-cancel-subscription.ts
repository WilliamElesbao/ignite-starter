import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cancelSubscriptionAction } from "../actions/manage-subscription.action";

export function useCancelSubscription() {
  const t = useTranslations("plans");

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await cancelSubscriptionAction();
      if (!result.success) throw new Error(result.error);

      return result;
    },
    onSuccess: () => {
      toast.success(t("cancel.subscription-canceled"), {
        description: t(
          "cancel.your-pro-access-continues-until-the-end-of-the-billing-period",
        ),
      });
    },
    onError: (err) => {
      toast.error(t("cancel.failed-to-cancel"), {
        description:
          err instanceof Error ? err.message : t("cancel.please-try-again"),
      });
    },
  });

  return { ...mutation };
}
