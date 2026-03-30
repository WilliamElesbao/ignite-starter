import { createErrorDto } from "../../../shared/dtos/error.dto";
import { AuthErrorCode } from "../auth.errors";

export const authUnauthorizedErrorDto = createErrorDto([
  AuthErrorCode.AUTH_UNAUTHORIZED,
] as const);

export const authSessionResolveFailedErrorDto = createErrorDto([
  AuthErrorCode.AUTH_SESSION_RESOLVE_FAILED,
] as const);
