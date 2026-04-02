import { getSessionOptions, getUserByIdOptions } from "@repo/api";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetches the current user session from the backend.
 * 
 * @returns React Query result containing session data and query state
 */
export const useGetSession = () => useQuery({ ...getSessionOptions() });

/**
 * Fetches a user by their ID from the backend.
 * 
 * @param userId - The unique identifier of the user to fetch
 * @returns React Query result containing user data and query state
 */
export const useGetUserById = ({ userId }: { userId: string }) =>
  useQuery({
    ...getUserByIdOptions({ path: { id: userId } }),
  });
