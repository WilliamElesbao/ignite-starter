import {
  patchStripeSubscriptionMutation,
  patchStripeSubscriptionRevokeMutation,
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
 * Revokes or cancels an active Stripe subscription.
 *
 * @returns Mutation hook for revoking a subscription
 */
export const useStripeRevokeSubscription = () =>
  useMutation({
    ...patchStripeSubscriptionRevokeMutation(),
  });
