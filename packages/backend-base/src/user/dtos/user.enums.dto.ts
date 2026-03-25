import { Role, Status } from "@repo/database/prisma/generated/prisma/client";
import { t } from "elysia";

export const RoleEnum = t.Enum(Role);
export const StatusEnum = t.Enum(Status);
