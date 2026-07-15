import {
  patchStripeSubscriptionCancelMutation,
  patchStripeSubscriptionMutation,
  postStripeSubscriptionMutation,
} from "@repo/api";
import { useMutation } from "@tanstack/react-query";

/**
 * Creates a new Stripe subscription for the current user.
 *
 * @returns Mutation hook for creating a subscription
 */
export const useStripeSubscription = () =>
  useMutation({
    ...postStripeSubscriptionMutation(),
  });

/**
 * Updates an existing Stripe subscription.
 *
 * @returns Mutation hook for updating a subscription
 */
export const useStripeUpdateSubscription = () =>
  useMutation({
    ...patchStripeSubscriptionMutation(),
  });

/**
 * Cancels an active Stripe subscription.
 *
 * @returns Mutation hook for canceling a subscription
 */
export const useStripeCancelSubscription = () =>
  useMutation({
    ...patchStripeSubscriptionCancelMutation(),
  });
