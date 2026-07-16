"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/better-auth/auth-client";
import { useRouter } from "@/lib/i18n/navigation";

export function useSignOut() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      router.replace("/sign-in");
      router.refresh();
    },
    onError: (err) => {
      toast.error("failed-to-sign-out", {
        description: err instanceof Error ? err.message : "failed-to-sign-out",
      });
    },
  });

  return { ...mutation };
}
