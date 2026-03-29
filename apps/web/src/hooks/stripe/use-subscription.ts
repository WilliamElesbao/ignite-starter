import { getStripeSubscriptionDetailsOptions } from "@repo/api";
import { useCallback } from "react";
import { toast } from "sonner";
import { useDialog } from "@/context";
import { queryClient } from "@/lib/react-query";
import {
  useStripeRevokeSubscription,
  useStripeSubscription,
  useStripeUpdateSubscription,
} from "./stripe.mutations";
import {
  type SubscriptionFormValues,
  useSubscriptionForm,
} from "./use-subscription-form";

/**
 * Hook to handle new Stripe subscription flow.
 *
 * @param priceId - The ID of the Stripe price selected
 * @returns Form instance and mutation handlers for subscription
 */
export const useSubscription = ({ priceId }: { priceId: string }) => {
  const { mutateAsync, isPending } = useStripeSubscription();
  const { form } = useSubscriptionForm({ priceId });
  const { setDialogIsOpen } = useDialog();

  const onSubmit = useCallback(
    async (data: SubscriptionFormValues) => {
      await mutateAsync(
        { body: data },
        {
          onSuccess: (ctx) => {
            toast.info("Redirecting to Stripe for subscription...", {
              description: "Please wait while we set up your subscription.",
              position: "top-center",
            });
            if (ctx?.url) {
              window.location.href = ctx.url;
            }
          },
          onError: (err) => {
            console.error("[Hook][useSubscription] onError:", err);
            toast.error("Failed to create subscription.", {
              description:
                "An error occurred while creating your subscription. Please try again.",
              position: "top-center",
            });
          },
          onSettled: () => {
            form.reset();
            setDialogIsOpen(false);
          },
        },
      );
    },
    [form, mutateAsync, setDialogIsOpen],
  );

  return {
    form,
    onSubmit,
    isPending,
  };
};

/**
 * Hook to handle updates to an existing subscription.
 *
 * @param priceId - The new Stripe price ID
 * @returns Form instance and mutation handlers for updating subscription
 */
export const useUpdateSubscription = ({ priceId }: { priceId: string }) => {
  const { mutateAsync, isPending } = useStripeUpdateSubscription();
  const { queryKey: subscriptionDetailsQueryKey } =
    getStripeSubscriptionDetailsOptions();
  const { form } = useSubscriptionForm({ priceId });
  const { setDialogIsOpen } = useDialog();

  const onSubmit = useCallback(
    async (data: SubscriptionFormValues) => {
      await mutateAsync(
        { body: data },
        {
          onSuccess: () => {
            toast.success("Subscription updated successfully!", {
              description: "Your subscription has been updated.",
              position: "top-center",
            });
            form.reset();
            setDialogIsOpen(false);
            queryClient.invalidateQueries({
              queryKey: subscriptionDetailsQueryKey,
            });
          },
          onError: (err) => {
            console.error("[Hook][useUpdateSubscription] onSubmit error:", err);
            toast.error("Failed to update subscription.", {
              description:
                "An error occurred while updating your subscription. Please try again.",
              position: "top-center",
            });
          },
        },
      );
    },
    [form, mutateAsync, setDialogIsOpen, subscriptionDetailsQueryKey],
  );

  return {
    form,
    onSubmit,
    isPending,
  };
};

/**
 * Hook to handle cancellation of an active subscription.
 *
 * @returns Mutation handler and submission method for canceling a subscription
 */
export const useCancelSubscription = () => {
  const mutation = useStripeRevokeSubscription();
  const { setDialogIsOpen } = useDialog();

  const onSubmit = useCallback(async () => {
    await mutation.mutateAsync(
      {},
      {
        onSuccess: () => {
          toast.info("Your subscription has been canceled.", {
            description:
              "You will not be charged for the next billing cycle.\nBut you can still access your account until the end of the current period.",
            position: "top-center",
          });
          setDialogIsOpen(false);
        },
        onError: (err) => {
          console.error("[Hook][useCancelSubscription] onSubmit error:", err);
          toast.error("Failed to cancel subscription.", {
            description:
              "An error occurred while canceling your subscription. Please try again.",
            position: "top-center",
          });
        },
      },
    );
  }, [mutation, setDialogIsOpen]);

  return {
    onSubmit,
    ...mutation,
  };
};
