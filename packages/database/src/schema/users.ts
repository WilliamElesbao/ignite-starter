import { randomUUIDv7 } from "bun";
import { type InferSelectModel, relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { accounts } from "./accounts";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  stripeCustomerId: text("stripe_customer_id"),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export type Users = InferSelectModel<typeof users>;
