import { WelcomeEmail } from "@repo/emails/src";
import { resend } from "../lib/resend";

const emailFrom = process.env.EMAIL_FROM ?? "";
const emailTo = process.env.EMAIL_TO ?? "";

export class EmailService {
  async sendWelcomeEmail() {
    try {
      const { data, error } = await resend.emails.send({
        from: emailFrom,
        to: emailTo,
        subject: "Welcome to Origin Starter!",
        react: WelcomeEmail({ name: "D3v" }),
      });

      return { data, error };
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  }
}
