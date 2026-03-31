import Elysia from "elysia";
import { toErrorResponse } from "../../shared/errors/to-error-response";
import shared from "../../shared/shared.plugin";
import { EmailResponseDto } from "./dtos/email-response.dto";
import {
  emailSend500ErrorDto,
  emailSend502ErrorDto,
} from "./dtos/errors/email-error.dto";
import { EMAIL_ERROR_MAP, EmailErrorCode } from "./email.errors";
import { EmailService } from "./email.service";

const emailPlugin = new Elysia({ tags: ["Email"] })
  .use(shared)
  .onError(({ error, set }) => {
    const response = toErrorResponse(error, {
      code: EmailErrorCode.EMAIL_SEND_FAILED,
      catalog: EMAIL_ERROR_MAP,
    });

    set.status = response.status;
    return response.body;
  })
  .state((state) => ({
    ...state,
    emailService: new EmailService(state.logger),
  }))
  .group("/email", (app) =>
    app.post(
      "/send",
      async ({ store: { emailService } }) => {
        await emailService.sendWelcomeEmail();

        return { message: "Email sent successfully", success: true };
      },
      {
        detail: { description: "Send a welcome email" },
        response: {
          200: EmailResponseDto,
          500: emailSend500ErrorDto,
          502: emailSend502ErrorDto,
        },
      },
    ),
  );

export type EmailPlugin = typeof emailPlugin;
export default emailPlugin;
