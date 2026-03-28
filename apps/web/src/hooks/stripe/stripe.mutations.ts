import {
  patchStripeSubscriptionMutation,
  patchStripeSubscriptionRevokeMutation,
  postStripeSubscriptionMutation,
} from "@repo/api";
import { useMutation } from "@tanstack/react-query";

export const useStripeSubscription = () =>
  useMutation({
    ...postStripeSubscriptionMutation({ credentials: "include" }),
  });

export const useStripeUpdateSubscription = () =>
  useMutation({
    ...patchStripeSubscriptionMutation({ credentials: "include" }),
  });

export const useStripeRevokeSubscription = () =>
  useMutation({
    ...patchStripeSubscriptionRevokeMutation({ credentials: "include" }),
  });
