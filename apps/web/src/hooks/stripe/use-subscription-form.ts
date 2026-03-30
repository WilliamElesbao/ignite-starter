import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@repo/api/generated/api/types.gen";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useGetStripeSubscriptionDetails } from "./stripe.queries";
import { useSubscription, useUpdateSubscription } from "./use-subscription";

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
export const useSubscriptionForm = ({ user }: { user: User }) => {
  const { data: subscriptionDetails } = useGetStripeSubscriptionDetails();

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priceId: subscriptionDetails?.plan?.priceId,
      planName: subscriptionDetails?.product?.name,
    },
    mode: "all",
  });

  const { onSubmit: subscriptionOnSubmit, isPending: isSubscriptionPending } =
    useSubscription();
  const {
    onSubmit: updateSubscriptionOnSubmit,
    isPending: isUpdateSubscriptionPending,
  } = useUpdateSubscription();

  const onSubmit = user?.stripeSubscriptionId
    ? updateSubscriptionOnSubmit
    : subscriptionOnSubmit;

  const selectedPriceId = useWatch({ control: form.control, name: "priceId" });
  const currentPriceId = subscriptionDetails?.plan?.priceId;
  const isSamePlanSelected = selectedPriceId === currentPriceId;
  const isFreePlanSelected = selectedPriceId === "free";
  const isLoading = isSubscriptionPending || isUpdateSubscriptionPending;
  const disableChangePlanButton =
    isSamePlanSelected || isFreePlanSelected || isLoading;
  const defaultValue =
    (useWatch({ control: form.control, name: "priceId" }) ||
      subscriptionDetails?.plan?.priceId) ??
    "free";

  return {
    form,
    onSubmit,
    isLoading,
    disableChangePlanButton,
    defaultValue,
  };
};
