import { Role, Status } from "@repo/db";
import { t } from "elysia";

export const RoleEnum = t.Enum(Role);
export const StatusEnum = t.Enum(Status);
