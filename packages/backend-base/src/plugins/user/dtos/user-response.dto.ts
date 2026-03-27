import { t } from "elysia";

export const UserResponseDto = t.Object({
  id: t.String(),
  image: t.Nullable(t.String()),
  name: t.String(),
  email: t.String({ format: "email" }),
  emailVerified: t.Boolean(),
  createdAt: t.Date({ format: "date-time" }),
  updatedAt: t.Date({ format: "date-time" }),
  stripeSubscriptionId: t.Nullable(t.String()),
});
