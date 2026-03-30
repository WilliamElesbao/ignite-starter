import { createErrorDto } from "../../../../shared/dtos/error.dto";
import { EmailErrorCode } from "../../email.errors";

export const emailSend500ErrorDto = createErrorDto([
  EmailErrorCode.EMAIL_SEND_FAILED,
] as const);

export const emailSend502ErrorDto = createErrorDto([
  EmailErrorCode.EMAIL_PROVIDER_ERROR,
] as const);
