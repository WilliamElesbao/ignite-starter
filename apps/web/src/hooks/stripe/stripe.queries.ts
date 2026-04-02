import {
  getStripeProductsOptions,
  getStripeSubscriptionDetailsOptions,
} from "@repo/api";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetches available Stripe products and pricing information.
 *
 * @returns React Query result with Stripe products data
 */
export const useGetStripeProducts = () =>
  useQuery({
    ...getStripeProductsOptions(),
  });

/**
 * Fetches the current user's Stripe subscription details.
 *
 * @returns React Query result with subscription details including status and plan information
 */
export const useGetStripeSubscriptionDetails = () =>
  useQuery({
    ...getStripeSubscriptionDetailsOptions(),
  });
