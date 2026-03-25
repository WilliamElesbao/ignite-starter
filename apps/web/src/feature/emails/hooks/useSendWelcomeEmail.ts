import { toast } from "sonner";
import { useSendEmail } from "@/hooks/email/email.mutation";
import { safePromise } from "@/utils/safe-promise";

export const useEmail = () => {
  const { mutateAsync } = useSendEmail();

  const sendWelcomeEmail = async () => {
    const [response, error] = await safePromise(mutateAsync({}));

    if (!response?.success || error) {
      toast.error("Failed to send email. Please try again.");
      return;
    }

    if (response.success) {
      toast.success("Email sent successfully!");
    }
  };

  return { sendWelcomeEmail };
};
