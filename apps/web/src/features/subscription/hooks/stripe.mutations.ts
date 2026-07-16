import {
  getStripeSubscriptionQueryKey,
  patchStripeSubscriptionCancelMutation,
  patchStripeSubscriptionMutation,
  postStripeSubscriptionMutation,
} from "@repo/api";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/lib/i18n/navigation";
import { getQueryClient } from "@/lib/react-query/query-client";
import { logger } from "@/utils/logger";

/**
 * Creates a new Stripe subscription for the current user.
 *
 * @returns Mutation hook for creating a subscription
 */
export const useStripeSubscription = () => {
  const router = useRouter();

  const mutation = useMutation({
    ...postStripeSubscriptionMutation(),
    onError: (error) => {
      logger.error("Error upgrading subscription:", error);
      toast.error(error.code, { description: error.message });
    },
    onSuccess: ({ url }) => {
      if (!url) {
        logger.error("No URL returned from subscription creation");
        toast.error("Failed to create subscription. Please try again.");
        return;
      }

      router.push(url);
    },
  });

  return { ...mutation };
};

/**
 * Renews an existing Stripe subscription.
 *
 * @returns Mutation hook for renewing a subscription
 */
export const useStripeRenewSubscription = () => {
  const t = useTranslations("plans");
  const queryClient = getQueryClient();

  const mutation = useMutation({
    ...patchStripeSubscriptionMutation(),
    onSuccess: () => {
      toast.success(t("renew.subscription-renewed"), {
        description: t(
          "renew.your-pro-access-subscription-will-continue-normally",
        ),
      });
      queryClient.invalidateQueries({
        queryKey: getStripeSubscriptionQueryKey(),
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
};

/**
 * Cancels an active Stripe subscription.
 *
 * @returns Mutation hook for canceling a subscription
 */
export const useStripeCancelSubscription = () => {
  const t = useTranslations("plans");
  const queryClient = getQueryClient();

  const mutation = useMutation({
    ...patchStripeSubscriptionCancelMutation(),
    onSuccess: () => {
      toast.success(t("cancel.subscription-canceled"), {
        description: t(
          "cancel.your-pro-access-continues-until-the-end-of-the-billing-period",
        ),
      });
      queryClient.invalidateQueries({
        queryKey: getStripeSubscriptionQueryKey(),
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
};
