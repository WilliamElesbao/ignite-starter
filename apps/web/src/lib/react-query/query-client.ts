import {
  environmentManager,
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { logger } from "@/utils/logger";

export function makeQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError(error) {
        logger.error(error);
      },
    }),

    queryCache: new QueryCache({
      onError(error) {
        logger.error(error);
      },
    }),

    defaultOptions: {
      queries: {
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
        staleTime: 60_000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * On the server every request gets a fresh QueryClient (prevents cache
 * leaking between users). In the browser a singleton preserves the cache
 * across renders and suspensions.
 */
export function getQueryClient() {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();

  return browserQueryClient;
}
