import { t } from "elysia";

export const EmailResponseDto = t.Object({
  message: t.String(),
  success: t.Boolean(),
  jobId: t.String(),
});
