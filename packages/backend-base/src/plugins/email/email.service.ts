import { WelcomeEmail } from "@repo/emails/templates";
import { env } from "../../env";
import { resend } from "../../lib/resend";
import { AppError } from "../../shared/errors/app-error";
import type { LoggerInfoErrorDependency } from "../../shared/types/logger-dependency";
import { EMAIL_ERROR_MAP, EmailErrorCode } from "./email.errors";

export class EmailService {
  private readonly emailFrom: string;
  private readonly emailTo: string;

  constructor(private readonly logger: LoggerInfoErrorDependency) {
    this.emailFrom = process.env.EMAIL_FROM ?? "";
    this.emailTo = process.env.EMAIL_TO ?? "";
  }

  async sendWelcomeEmail() {
    try {
      const { data, error } = await resend.emails.send({
        from: this.emailFrom,
        to: this.emailTo,
        subject: "Welcome to Ignite Starter!",
        react: WelcomeEmail({ name: "D3v", actionUrl: env.WEB_URL }),
      });

      if (error) {
        this.logger.error({
          msg: "Email provider returned an error",
          provider: "resend",
          to: this.emailTo,
          error,
        });

        throw AppError.fromCatalog({
          code: EmailErrorCode.EMAIL_PROVIDER_ERROR,
          catalog: EMAIL_ERROR_MAP,
          details: error,
        });
      }

      this.logger.info({
        msg: "Welcome email sent",
        provider: "resend",
        to: this.emailTo,
      });

      return data;
    } catch (error) {
      this.logger.error({
        msg: "Failed to send welcome email",
        provider: "resend",
        to: this.emailTo,
        error,
      });

      throw AppError.fromUnknown(error, {
        code: EmailErrorCode.EMAIL_SEND_FAILED,
        catalog: EMAIL_ERROR_MAP,
      });
    }
  }
}
