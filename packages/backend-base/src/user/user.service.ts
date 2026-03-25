import type { UserDto } from "@repo/database";
import type { db } from "../shared/shared.plugin";

export class UserService {
  constructor(private readonly db: db) {}

  async getUserById({ id }: Pick<UserDto, "id">) {
    const user = await this.db.user.findUnique({ where: { id } });
    if (!user) {
      throw new Error(`User with ID ${id} not found.`);
    }
    return user;
  }
}
