import type { ErrorCatalog } from "../../shared/errors/error-catalog";

export enum AuthErrorCode {
  AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED",
  AUTH_SESSION_RESOLVE_FAILED = "AUTH_SESSION_RESOLVE_FAILED",
}

export const AUTH_ERROR_MAP: ErrorCatalog<AuthErrorCode> = {
  [AuthErrorCode.AUTH_UNAUTHORIZED]: {
    message: "Unauthorized",
    status: 401,
  },
  [AuthErrorCode.AUTH_SESSION_RESOLVE_FAILED]: {
    message: "Failed to validate session",
    status: 503,
  },
};
