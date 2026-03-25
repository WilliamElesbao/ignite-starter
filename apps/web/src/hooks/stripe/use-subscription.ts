import {
  type UseQueryResult,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import type z from "zod";
import { REACT_QUERY_KEYS } from "@/constants";
import { useDialog } from "@/context";
import { queryClient } from "@/lib/react-query";
import type {
  SubscriptionDetailsPayloadDto,
  SubscriptionDetailsResponseDto,
  SubscriptionPayloadDto,
} from "@/services/stripe/dtos";
import { StripeService } from "@/services/stripe/stripe.service";
import { useSubscriptionForm } from "./use-subscription-form";

/**
 * Hook to handle new Stripe subscription flow.
 *
 * @param priceId - The ID of the Stripe price selected
 * @param userId - The ID of the user initiating the subscription
 * @returns Form instance and mutation handlers for subscription
 */
export const useSubscription = ({
  priceId,
  userId,
}: Partial<Omit<SubscriptionPayloadDto, "planName">>) => {
  const { setDialogIsOpen } = useDialog();
  const { form } = useSubscriptionForm({
    priceId,
    userId,
  });

  const mutation = useMutation({
    mutationKey: [REACT_QUERY_KEYS.SUBSCRIPTION],
    mutationFn: async (data: z.infer<typeof SubscriptionPayloadDto>) => {
      const service = new StripeService();
      try {
        toast.info("Redirecting to Stripe for subscription...", {
          description: "Please wait while we set up your subscription.",
          position: "top-center",
        });
        const { url } = await service.subscription(data);
        window.location.href = url;
        return url;
      } catch (error) {
        console.error("[Hook][useSubscription] subscription error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SUBSCRIPTION_DETAILS],
      });
    },
    onError: (error) => {
      console.error("[Hook][useSubscription] onError:", error);
    },
  });

  const onSubmit = useCallback(
    async (data: z.infer<typeof SubscriptionPayloadDto>) => {
      try {
        await mutation.mutateAsync(data);
      } catch (error) {
        console.error("[Hook][useSubscription] onSubmit error:", error);
      } finally {
        setDialogIsOpen(false);
      }
    },
    [mutation, setDialogIsOpen],
  );

  return {
    form,
    onSubmit,
    ...mutation,
  };
};

/**
 * Custom React hook to fetch Stripe subscription details.
 *
 * @param {SubscriptionDetailsPayloadDto} params
 * - `stripeSubscriptionId` (string): The ID of the Stripe subscription to fetch details for.
 *
 * @returns {UseQueryResult<SubscriptionDetailsResponseDto | null>}
 * - An object containing the query status, data, error, and refetch utilities.
 * - Returns `null` if `stripeSubscriptionId` is not provided.
 *
 * @example
 * const { data, isLoading, error } = useSubscriptionDetails({ stripeSubscriptionId: "sub_123" });
 *
 * @remarks
 * - Uses React Query for caching and automatic retry.
 * - Handles error logging and safe fallback (`null`) when ID is missing.
 */
export const useSubscriptionDetails = ({
  stripeSubscriptionId,
}: SubscriptionDetailsPayloadDto): UseQueryResult<SubscriptionDetailsResponseDto | null> => {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.SUBSCRIPTION_DETAILS, stripeSubscriptionId],
    queryFn: async () => {
      const service = new StripeService();

      if (!stripeSubscriptionId) return null;

      try {
        return await service.subscriptionDetails({ stripeSubscriptionId });
      } catch (error) {
        console.error(
          "[Hook][useSubscriptionDetails] Error fetching subscription details:",
          error,
        );
        throw error;
      }
    },
  });
};

/**
 * Hook to handle updates to an existing subscription.
 *
 * @param priceId - The new Stripe price ID
 * @param userId - The user whose subscription is being updated
 * @returns Form instance and mutation handlers for updating subscription
 */
export const useUpdateSubscription = ({
  priceId,
  userId,
}: Partial<Omit<SubscriptionPayloadDto, "planName">>) => {
  const { setDialogIsOpen } = useDialog();
  const { form } = useSubscriptionForm({
    priceId,
    userId,
  });

  const mutation = useMutation({
    mutationKey: [REACT_QUERY_KEYS.UPDATE_SUBSCRIPTION],
    mutationFn: async (data: z.infer<typeof SubscriptionPayloadDto>) => {
      const service = new StripeService();
      try {
        const { updated } = await service.updateSubscription(data);
        toast.success("Subscription updated successfully!", {
          description: "Your subscription has been updated.",
          position: "top-center",
        });
        return updated;
      } catch (error) {
        console.error(
          "[Hook][useUpdateSubscription] subscription error:",
          error,
        );
        throw error;
      }
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SUBSCRIPTION_DETAILS],
      });
    },
    onError: (error) => {
      console.error("[Hook][useUpdateSubscription] subscription error:", error);
    },
  });

  const onSubmit = useCallback(
    async (data: z.infer<typeof SubscriptionPayloadDto>) => {
      try {
        await mutation.mutateAsync(data);
      } catch (error) {
        console.error("[Hook][useUpdateSubscription] onSubmit error:", error);
      } finally {
        setDialogIsOpen(false);
      }
    },
    [mutation, setDialogIsOpen],
  );

  return {
    form,
    onSubmit,
    ...mutation,
  };
};

/**
 * Hook to handle cancellation of an active subscription.
 *
 * @returns Mutation handler and submission method for canceling a subscription
 */
export const useCancelSubscription = () => {
  const { setDialogIsOpen } = useDialog();
  const mutation = useMutation({
    mutationKey: [REACT_QUERY_KEYS.CANCEL_SUBSCRIPTION],
    mutationFn: async () => {
      const service = new StripeService();
      try {
        const response = await service.cancelSubscription();
        toast.success("Subscription canceled successfully!", {
          description: "Your subscription has been canceled.",
          position: "top-center",
        });
        return response;
      } catch (error) {
        console.error("[Hook][useCancelSubscription] cancel error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("[Hook][useCancelSubscription] cancel success:", data);
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SUBSCRIPTION_DETAILS],
      });
      toast.info("Your subscription has been canceled.", {
        description:
          "You will not be charged for the next billing cycle.\nBut you can still access your account until the end of the current period.",
        position: "top-center",
      });
    },
    onError: (error) => {
      console.error("[Hook][useCancelSubscription] cancel error:", error);
    },
  });

  const onSubmit = useCallback(async () => {
    try {
      await mutation.mutateAsync();
    } catch (error) {
      console.error("[Hook][useCancelSubscription] onSubmit error:", error);
    } finally {
      setDialogIsOpen(false);
    }
  }, [mutation, setDialogIsOpen]);

  return {
    onSubmit,
    ...mutation,
  };
};
