// import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  priceId: z.string(),
  planName: z.string(),
});

export type SubscriptionFormValues = z.infer<typeof formSchema>;

/**
 * Hook to create and manage the subscription form using React Hook Form and Zod.
 *
 * @param priceId - The Stripe price ID (defaults to `"free"`).
 * @param userId - The ID of the user subscribing.
 * @returns A configured form instance for the subscription.
 */
export const useSubscriptionForm = ({ priceId }: { priceId: string }) => {
  const form = useForm<SubscriptionFormValues>({
    // resolver: zodResolver(SubscriptionPayloadDto),
    defaultValues: {
      priceId: priceId ?? "free",
      planName: "",
    },
    mode: "onChange",
  });

  return { form };
};
