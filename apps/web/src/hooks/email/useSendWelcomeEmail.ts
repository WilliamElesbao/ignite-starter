import { toast } from "sonner";
import { safePromise } from "@/utils";
import { useSendEmail } from "./email.mutation";

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
