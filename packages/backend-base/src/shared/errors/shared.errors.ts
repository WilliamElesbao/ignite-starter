import type { ErrorCatalog } from "./error-catalog";

export enum SharedErrorCode {
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  REQUEST_VALIDATION_FAILED = "REQUEST_VALIDATION_FAILED",
}

export const SHARED_ERROR_MAP: ErrorCatalog<SharedErrorCode> = {
  [SharedErrorCode.INTERNAL_SERVER_ERROR]: {
    message: "Unexpected internal error",
    status: 500,
  },
  [SharedErrorCode.REQUEST_VALIDATION_FAILED]: {
    message: "Request validation failed",
    status: 422,
  },
};
