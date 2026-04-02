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
 * Manages subscription form state and submission logic for creating or updating Stripe subscriptions.
 * Automatically detects whether to create a new subscription or update an existing one.
 * 
 * @returns Object containing form instance, submit handler, loading state, and button disable state
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
