import { t } from "elysia";
import { RoleEnum, StatusEnum } from "./user.enums.dto";

export const UserResponseDto = t.Object({
  id: t.String(),
  image: t.Nullable(t.String()),
  name: t.String(),
  surname: t.String(),
  email: t.String({ format: "email" }),
  emailVerified: t.Boolean(),
  otpCode: t.Nullable(t.String()),
  otpExpiresAt: t.Nullable(t.String()),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
  role: RoleEnum,
  status: StatusEnum,
  lastLogin: t.Nullable(t.String({ format: "date-time" })),
  stripeSubscriptionId: t.Nullable(t.String()),
});
