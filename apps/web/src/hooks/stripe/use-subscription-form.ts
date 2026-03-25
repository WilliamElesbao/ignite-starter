// import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { SubscriptionPayloadDto } from "@/services/stripe/dtos";

/**
 * Hook to create and manage the subscription form using React Hook Form and Zod.
 *
 * @param priceId - The Stripe price ID (defaults to `"free"`).
 * @param userId - The ID of the user subscribing.
 * @returns A configured form instance for the subscription.
 */
export const useSubscriptionForm = ({
  priceId,
  userId,
}: Partial<
  Pick<z.infer<typeof SubscriptionPayloadDto>, "priceId" | "userId">
>) => {
  const form = useForm<z.infer<typeof SubscriptionPayloadDto>>({
    // resolver: zodResolver(SubscriptionPayloadDto),
    defaultValues: {
      priceId: priceId ?? "free",
      planName: "",
      userId: userId ?? "",
    },
    mode: "onChange",
  });

  return { form };
};
