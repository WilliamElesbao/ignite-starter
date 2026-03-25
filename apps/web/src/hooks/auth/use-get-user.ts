import type { User } from "@repo/database/prisma/generated/prisma/client";
import { toast } from "sonner";
import { useGetUserById } from "../user/user.queries";

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
}) => {
  const { data: user } = useGetUserById({ userId: id });

  try {
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
};
