import type { User } from "@repo/database/prisma/generated/prisma/client";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getUserByIdAction } from "@/actions";
import { REACT_QUERY_KEYS } from "@/constants/queries-keys";

/**
 * Hook to fetch user data from server action and show welcome toast.
 * This hook should only be used on the client side to trigger the welcome toast.
 * @returns User data, loading and error states.
 */
export const useGetUser = ({
  id,
  showWelcomeToast = false,
}: Pick<User, "id"> & {
  showWelcomeToast?: boolean;
}): UseQueryResult<User | null> => {
  return useQuery({
    enabled: !!id,
    queryKey: [REACT_QUERY_KEYS.USER, id],
    queryFn: async () => {
      try {
        const user = await getUserByIdAction({ id });

        if (user && showWelcomeToast) {
          toast.success("Hey d3v!", {
            description:
              "Welcome to Fox Starter, Wow, the authentication worked perfectly!",
            position: "top-center",
          });
        }

        return user;
      } catch (error) {
        console.error("[Hook][useGetUser] Error fetching user:", error);
        throw error;
      }
    },
  });
};
