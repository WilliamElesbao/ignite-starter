import { getUserByIdOptions } from "@repo/api";
import { useQuery } from "@tanstack/react-query";

export const useGetUserById = () =>
  useQuery({
    ...getUserByIdOptions({ path: { id: "wcUjRNf4TvH5NdnabEnzHoIddTsdLWxO" } }),
  });
