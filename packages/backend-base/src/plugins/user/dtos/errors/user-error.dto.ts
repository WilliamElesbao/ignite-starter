import { createErrorDto } from "../../../../shared/dtos/error.dto";
import { UserErrorCode } from "../../user.errors";

export const userNotFoundErrorDto = createErrorDto([
  UserErrorCode.USER_NOT_FOUND,
] as const);

export const userInternalErrorDto = createErrorDto([
  UserErrorCode.USER_FETCH_FAILED,
] as const);
