import type { Logger } from "pino";

export type LoggerDependency = Pick<Logger, "error" | "warn" | "info">;

export type LoggerErrorDependency = Pick<Logger, "error">;

export type LoggerInfoErrorDependency = Pick<Logger, "info" | "error">;
