import { schema, type Users } from "@repo/db";
import { eq } from "drizzle-orm";
import { AppError } from "../../shared/errors/app-error";
import type { db } from "../../shared/shared.plugin";
import { safePromise } from "../../utils/safe-promise";
import { USER_ERROR_MAP, UserErrorCode } from "./user.errors";

export class UserService {
  constructor(private readonly db: db) {}

  async getUserById({ id }: Pick<Users, "id">) {
    const [users, usersError] = await safePromise(
      this.db.select().from(schema.users).where(eq(schema.users.id, id)),
    );

    if (usersError) {
      throw AppError.fromCatalog({
        code: UserErrorCode.USER_FETCH_FAILED,
        catalog: USER_ERROR_MAP,
        details: usersError,
      });
    }

    const [user] = users;
    return user;
  }
}
