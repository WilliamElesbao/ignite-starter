import { WelcomeEmail } from "@repo/emails/templates";
import { env } from "../../env";
import { resend } from "../../lib/resend";
import { AppError } from "../../shared/errors/app-error";
import { EMAIL_ERROR_MAP, EmailErrorCode } from "./email.errors";

const emailFrom = process.env.EMAIL_FROM ?? "";
const emailTo = process.env.EMAIL_TO ?? "";

export class EmailService {
  async sendWelcomeEmail() {
    try {
      const { data, error } = await resend.emails.send({
        from: emailFrom,
        to: emailTo,
        subject: "Welcome to Ignite Starter!",
        react: WelcomeEmail({ name: "D3v", actionUrl: env.WEB_URL }),
      });

      if (error) {
        throw AppError.fromCatalog({
          code: EmailErrorCode.EMAIL_PROVIDER_ERROR,
          catalog: EMAIL_ERROR_MAP,
          details: error,
        });
      }

      return data;
    } catch (error) {
      throw AppError.fromUnknown(error, {
        code: EmailErrorCode.EMAIL_SEND_FAILED,
        catalog: EMAIL_ERROR_MAP,
      });
    }
  }
}
