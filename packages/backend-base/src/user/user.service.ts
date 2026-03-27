import type { Users } from "@repo/db";
import { eq } from "drizzle-orm";
import { schema } from "../../../database/src/schema";
import type { db } from "../shared/shared.plugin";

export class UserService {
  constructor(private readonly db: db) {}

  async getUserById({ id }: Pick<Users, "id">) {
    // pg + prisma
    // const user = await this.db.user.findUnique({ where: { id } });
    // pg + drizzle
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    return user;
  }
}
