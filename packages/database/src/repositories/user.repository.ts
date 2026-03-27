import { eq } from "drizzle-orm";
import { db } from "../client";
import { schema, type Users } from "../schema";

export class UserRepository {
  constructor(private readonly model = db) {}

  /**
   * Retrieves a user by their unique ID.
   * @param idDto - DTO containing the user ID.
   * @returns The user object if found, or `null` if not found.
   */
  async findUserById({ id }: Pick<Users, "id">) {
    try {
      // return await this.model.findUnique({ where: { id } });
      return await this.model
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id));
    } catch (error) {
      console.error(`[UserRepository] Failed to find user by ID: ${id}`, error);
      throw new Error("Failed to retrieve user from the database.");
    }
  }
}
