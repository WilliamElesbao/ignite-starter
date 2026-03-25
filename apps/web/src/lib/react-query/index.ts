import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error(error.name);
      console.error(error.message);
    },
  }),
  queryCache: new QueryCache({
    onError: (error) => {
      console.error(error.name);
      console.error(error.message);
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});
