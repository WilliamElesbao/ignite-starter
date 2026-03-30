import type { ErrorCatalog } from "../../shared/errors/error-catalog";

export enum UserErrorCode {
  USER_NOT_FOUND = "USER_NOT_FOUND",
  USER_FETCH_FAILED = "USER_FETCH_FAILED",
}

export const USER_ERROR_MAP: ErrorCatalog<UserErrorCode> = {
  [UserErrorCode.USER_NOT_FOUND]: {
    message: "User not found",
    status: 404,
  },
  [UserErrorCode.USER_FETCH_FAILED]: {
    message: "Failed to retrieve user",
    status: 500,
  },
};
