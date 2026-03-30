import { AppError } from "./app-error";
import type { ErrorCatalog } from "./error-catalog";
import { SHARED_ERROR_MAP, SharedErrorCode } from "./shared.errors";

type ErrorResponseFallback<TCode extends string> = {
  code: TCode;
  catalog: ErrorCatalog<TCode>;
};

export const toErrorResponse = <TCode extends string>(
  error: unknown,
  fallback?: ErrorResponseFallback<TCode>,
) => {
  const normalizedError = fallback
    ? AppError.fromUnknown(error, fallback)
    : AppError.fromUnknown(error, {
        code: SharedErrorCode.INTERNAL_SERVER_ERROR,
        catalog: SHARED_ERROR_MAP,
      });

  return {
    status: normalizedError.status,
    body: {
      code: normalizedError.code,
      message: normalizedError.message,
    },
  };
};
