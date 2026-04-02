import { getStripeSubscriptionDetailsQueryKey } from "@repo/api";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";
import { useDialog } from "@/context/dialog.context";
import { queryClient } from "@/lib/react-query";
import { delay } from "@/utils";
import {
  useStripeRevokeSubscription,
  useStripeSubscription,
  useStripeUpdateSubscription,
} from "./stripe.mutations";
import type { SubscriptionFormValues } from "./useSubscriptionForm";

/**
 * Manages the creation of a new Stripe subscription with checkout redirect.
 *
 * @returns Object containing onSubmit handler and isPending state
 */
export const useSubscription = () => {
  const t = useTranslations("dashboard.toast.subscription");
  const { mutateAsync, isPending } = useStripeSubscription();
  const { setDialogIsOpen } = useDialog();

  const onSubmit = useCallback(
    async (data: SubscriptionFormValues) => {
      await mutateAsync(
        { body: data },
        {
          onSuccess: async (ctx) => {
            toast.info(t("redirecting-to-stripe-for-subscription"), {
              description: t("please-wait-while-we-set-up-your-subscription"),
              position: "top-center",
            });

            await delay(2);

            if (ctx?.url) {
              window.location.href = ctx.url;
            }
          },
          onError: (err) => {
            console.error("[Hook][useSubscription] onError:", err);
            toast.error(t("failed-to-create-subscription"), {
              description: t(
                "an-error-occurred-while-creating-your-subscription",
              ),
              position: "top-center",
            });
          },
          onSettled: () => {
            setDialogIsOpen(false);
          },
        },
      );
    },
    [mutateAsync, setDialogIsOpen, t],
  );

  return {
    onSubmit,
    isPending,
  };
};

/**
 * Manages updates to an existing Stripe subscription.
 *
 * @returns Object containing onSubmit handler and isPending state
 */
export const useUpdateSubscription = () => {
  const t = useTranslations("dashboard.toast.update-subscription");
  const { mutateAsync, isPending } = useStripeUpdateSubscription();
  const { setDialogIsOpen } = useDialog();

  const onSubmit = useCallback(
    async (data: SubscriptionFormValues) => {
      await mutateAsync(
        { body: data },
        {
          onSuccess: () => {
            toast.success(t("subscription-updated-successfully"), {
              description: t("your-subscription-has-been-updated"),
              position: "top-center",
            });
            setDialogIsOpen(false);
            queryClient.invalidateQueries({
              queryKey: getStripeSubscriptionDetailsQueryKey(),
            });
          },
          onError: (err) => {
            console.error("[Hook][useUpdateSubscription] onSubmit error:", err);
            toast.error(t("failed-to-update-subscription"), {
              description: t(
                "an-error-occurred-while-updating-your-subscription",
              ),
              position: "top-center",
            });
          },
        },
      );
    },
    [mutateAsync, setDialogIsOpen, t],
  );

  return {
    onSubmit,
    isPending,
  };
};

/**
 * Manages cancellation of an active Stripe subscription.
 *
 * @returns Object containing onSubmit handler and mutation state
 */
export const useCancelSubscription = () => {
  const t = useTranslations("dashboard.toast.cancel-subscription");
  const mutation = useStripeRevokeSubscription();
  const { setDialogIsOpen } = useDialog();

  const onSubmit = useCallback(async () => {
    await mutation.mutateAsync(
      {},
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getStripeSubscriptionDetailsQueryKey(),
          });
          toast.info(t("your-subscription-has-been-canceled"), {
            description: t(
              "you-will-not-be-charged-for-the-next-billing-cycle",
            ),
            position: "top-center",
          });
          setDialogIsOpen(false);
        },
        onError: (err) => {
          console.error("[Hook][useCancelSubscription] onSubmit error:", err);
          toast.error(t("failed-to-cancel-subscription"), {
            description: t(
              "an-error-occurred-while-canceling-your-subscription",
            ),
            position: "top-center",
          });
        },
      },
    );
  }, [mutation, setDialogIsOpen, t]);

  return {
    onSubmit,
    ...mutation,
  };
};
