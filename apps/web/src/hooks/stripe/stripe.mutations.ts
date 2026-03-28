import {
  patchStripeSubscriptionMutation,
  patchStripeSubscriptionRevokeMutation,
  postStripeSubscriptionMutation,
} from "@repo/api";
import { useMutation } from "@tanstack/react-query";

export const useStripeSubscription = () =>
  useMutation({
    ...postStripeSubscriptionMutation(),
  });

export const useStripeUpdateSubscription = () =>
  useMutation({
    ...patchStripeSubscriptionMutation(),
  });

export const useStripeRevokeSubscription = () =>
  useMutation({
    ...patchStripeSubscriptionRevokeMutation(),
  });
