import axios from "axios";
import { toast } from "sonner";
import { safePromise } from "@/utils/safe-promise";

export const useEmail = () => {
  const sendEmail = async () => {
    const [success, error] = await safePromise(
      axios.post(
        "/api/send",
        {},
        {
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    if (error) {
      toast.error("Failed to send email. Please try again.");
      return;
    }

    if (success.status === 200) {
      toast.success("Email sent successfully!");
    }
  };

  return { sendEmail };
};
