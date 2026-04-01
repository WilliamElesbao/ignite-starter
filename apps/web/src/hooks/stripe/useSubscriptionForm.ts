import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useGetStripeSubscriptionDetails } from "./stripe.queries";
import { useSubscription, useUpdateSubscription } from "./useSubscription";

const formSchema = z.object({
  priceId: z.string(),
  planName: z.string(),
});

export type SubscriptionFormValues = z.infer<typeof formSchema>;

/**
 * Hook to create and manage the subscription form using React Hook Form and Zod.
 *
 * @param priceId - The Stripe price ID (defaults to `"free"`).
 * @param userId - The ID of the user subscribing.
 * @returns A configured form instance for the subscription.
 */
export const useSubscriptionForm = () => {
  const { data: subscriptionDetails } = useGetStripeSubscriptionDetails();

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priceId: "free",
      planName: "Free",
    },
    mode: "all",
  });

  useEffect(() => {
    form.reset({
      priceId: subscriptionDetails?.plan?.priceId ?? "free",
      planName: subscriptionDetails?.product?.name ?? "Free",
    });
  }, [subscriptionDetails, form]);

  const { onSubmit: subscriptionOnSubmit, isPending: isSubscriptionPending } =
    useSubscription();
  const {
    onSubmit: updateSubscriptionOnSubmit,
    isPending: isUpdateSubscriptionPending,
  } = useUpdateSubscription();

  const onSubmit = subscriptionDetails?.hasActiveSubscription
    ? updateSubscriptionOnSubmit
    : subscriptionOnSubmit;

  const selectedPriceId = useWatch({
    control: form.control,
    name: "priceId",
    defaultValue: "free",
  });
  const currentPriceId = subscriptionDetails?.plan?.priceId;
  const isSamePlanSelected = selectedPriceId === currentPriceId;
  const isFreePlanSelected = selectedPriceId === "free";
  const isLoading = isSubscriptionPending || isUpdateSubscriptionPending;
  const disableChangePlanButton =
    isSamePlanSelected || isFreePlanSelected || isLoading;

  return {
    form,
    onSubmit,
    isLoading,
    disableChangePlanButton,
  };
};
