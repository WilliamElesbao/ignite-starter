import { getUserByIdOptions } from "@repo/api";
import { useQuery } from "@tanstack/react-query";

export const useGetUserById = ({ userId }: { userId: string }) =>
  useQuery({
    ...getUserByIdOptions({ path: { id: userId } }),
  });
