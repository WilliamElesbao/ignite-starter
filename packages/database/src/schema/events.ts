import { randomUUIDv7 } from "bun";
import type { InferSelectModel } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const events = pgTable(
  "events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    type: text("type").notNull(),
    userId: text("user_id"),
    payload: jsonb("payload").$type<unknown>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("events_type_idx").on(table.type),
    index("events_user_id_idx").on(table.userId),
  ],
);

export type Events = InferSelectModel<typeof events>;
