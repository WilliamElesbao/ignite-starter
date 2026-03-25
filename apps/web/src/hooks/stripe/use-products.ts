import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { REACT_QUERY_KEYS } from "@/constants";
import { StripeService } from "@/services";
import type { ProductListDto } from "@/services/stripe/dtos";

/**
 * Hook to fetch Stripe product list.
 * @returns Stripe products data, loading and error states.
 */
export const useProducts = (): UseQueryResult<ProductListDto> => {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.PRODUCTS],
    queryFn: async () => {
      const service = new StripeService();
      try {
        return await service.products();
      } catch (error) {
        console.error(
          "[Hook][useFetchStripeProducts] Error fetching products:",
          error,
        );
        throw error;
      }
    },
  });
};
