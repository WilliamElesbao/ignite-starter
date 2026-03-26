import type { User } from "../../prisma/generated/prisma/client";
import { db } from "../connection";

export class UserRepository {
  constructor(private readonly model = db.user) {}

  /**
   * Retrieves a user by their unique ID.
   * @param idDto - DTO containing the user ID.
   * @returns The user object if found, or `null` if not found.
   */
  async findUserById({ id }: Pick<User, "id">): Promise<User | null> {
    try {
      return await this.model.findUnique({ where: { id } });
    } catch (error) {
      console.error(`[UserRepository] Failed to find user by ID: ${id}`, error);
      throw new Error("Failed to retrieve user from the database.");
    }
  }
}
