import type { ErrorCatalog } from "../../shared/errors/error-catalog";

export enum EmailErrorCode {
  EMAIL_PROVIDER_ERROR = "EMAIL_PROVIDER_ERROR",
  EMAIL_SEND_FAILED = "EMAIL_SEND_FAILED",
}

export const EMAIL_ERROR_MAP: ErrorCatalog<EmailErrorCode> = {
  [EmailErrorCode.EMAIL_PROVIDER_ERROR]: {
    message: "Failed to send email",
    status: 502,
  },
  [EmailErrorCode.EMAIL_SEND_FAILED]: {
    message: "Failed to send email",
    status: 500,
  },
};
