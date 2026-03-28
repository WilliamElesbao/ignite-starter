import Elysia from "elysia";
import shared from "../../shared/shared.plugin";
import { EmailResponseDto } from "./dtos/email-response.dto";
import { EmailService } from "./email.service";

const emailPlugin = new Elysia({ tags: ["Email"] })
  .use(shared)
  .state((state) => ({
    ...state,
    emailService: new EmailService(),
  }))
  .group("/email", (app) =>
    app.post(
      "/send",
      async ({ store: { emailService }, set }) => {
        const sendEmail = await emailService.sendWelcomeEmail();

        if (sendEmail?.error) {
          set.status = 500;
          return { message: "Failed to send email", success: false };
        }

        return { message: "Email sent successfully", success: true };
      },
      {
        detail: { description: "Send a welcome email" },
        response: {
          200: EmailResponseDto,
          500: EmailResponseDto,
        },
      },
    ),
  );

export type EmailPlugin = typeof emailPlugin;
export default emailPlugin;
