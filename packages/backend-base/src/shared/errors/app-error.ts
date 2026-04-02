import type { ErrorCatalog } from "./error-catalog";

type AppErrorInput<TCode extends string = string> = {
  code: TCode;
  status: number;
  message: string;
  details?: unknown;
};

type AppErrorFromCatalogInput<TCode extends string> = {
  code: TCode;
  catalog: ErrorCatalog<TCode>;
  details?: unknown;
  status?: number;
  message?: string;
};

type AppErrorFallbackInput<TCode extends string> = Omit<
  AppErrorFromCatalogInput<TCode>,
  "details"
>;

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor({ code, status, message, details }: AppErrorInput) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static fromCatalog<TCode extends string>({
    code,
    catalog,
    details,
    status,
    message,
  }: AppErrorFromCatalogInput<TCode>) {
    const definition = catalog[code];

    return new AppError({
      code,
      status: status ?? definition.status,
      message: message ?? definition.message,
      details,
    });
  }

  static fromUnknown<TCode extends string>(
    error: unknown,
    fallback: AppErrorFallbackInput<TCode>,
  ) {
    if (error instanceof AppError) {
      return error;
    }

    return AppError.fromCatalog({
      ...fallback,
      details: error,
    });
  }
}
