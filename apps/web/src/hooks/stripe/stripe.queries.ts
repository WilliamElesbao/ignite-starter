import {
  getStripeProductsOptions,
  getStripeSubscriptionDetailsOptions,
} from "@repo/api";
import { useQuery } from "@tanstack/react-query";

export const useGetStripeProducts = () =>
  useQuery({
    ...getStripeProductsOptions(),
  });

export const useGetStripeSubscriptionDetails = () =>
  useQuery({
    ...getStripeSubscriptionDetailsOptions(),
  });
