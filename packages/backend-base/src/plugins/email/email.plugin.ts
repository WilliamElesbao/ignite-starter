import Elysia from "elysia";
import { toErrorResponse } from "../../shared/errors/to-error-response";
import authPlugin from "../auth/auth.plugin";
import { bullBoardPlugin, EMAIL_JOBS } from "../queue";
import { EmailResponseDto } from "./dtos/email-response.dto";
import {
  emailSend500ErrorDto,
  emailSend502ErrorDto,
} from "./dtos/errors/email-error.dto";
import { EMAIL_ERROR_MAP, EmailErrorCode } from "./email.errors";

const emailPlugin = new Elysia({ tags: ["Email"] })
  .use(bullBoardPlugin) // Bull Board provides emailQueueService
  .use(authPlugin)
  .onError(({ error, set }) => {
    const response = toErrorResponse(error, {
      code: EmailErrorCode.EMAIL_SEND_FAILED,
      catalog: EMAIL_ERROR_MAP,
    });

    set.status = response.status;
    return response.body;
  })
  .group("/email", (app) =>
    app.post(
      "/send",
      async ({ store: { emailQueueService }, user }) => {
        // Enqueue email job for asynchronous processing
        const jobId = await emailQueueService.addJob(EMAIL_JOBS.SEND_WELCOME, {
          userId: user.id,
          email: user.email,
        });

        // Return immediately with job ID
        return {
          message: "Email queued successfully",
          success: true,
          jobId,
        };
      },
      {
        auth: true,
        detail: {
          description:
            "Queue a welcome email for asynchronous processing. Returns immediately with a job ID.",
        },
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
