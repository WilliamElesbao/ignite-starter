import { schema } from "@repo/db";
import type { db } from "../shared/shared.plugin";
import type { LoggerErrorDependency } from "../shared/types/logger-dependency";

export const EVENT_TYPE = {
  STRIPE_PAYMENT_FAILED: "STRIPE_PAYMENT_FAILED",
  SUBSCRIPTION_CANCELED: "SUBSCRIPTION_CANCELED",
  LOGIN_SUSPICIOUS: "LOGIN_SUSPICIOUS",
} as const;

export type EventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];

type CreateEventInput = {
  type: EventType;
  userId?: string;
  payload?: unknown;
};

export class EventService {
  constructor(
    private readonly db: db,
    private readonly logger: LoggerErrorDependency,
  ) {}

  async createEvent({ type, userId, payload }: CreateEventInput) {
    try {
      await this.db.insert(schema.events).values({
        type,
        userId,
        payload,
      });
    } catch (error) {
      this.logger.error({
        msg: "Failed to persist business event",
        type,
        userId,
        error,
      });
    }
  }
}
