import type { UserRepository } from "@/database/repositories";
import type { UserDto } from "@/database/repositories/dtos";
import type { User } from "@/prisma/generated/prisma/client";

/**
 * Service responsible for user-related business logic.
 */
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Retrieves a user by ID.
   *
   * @param idDto - DTO containing the user ID.
   * @returns The user object if found, or `null` if not found.
   * @throws Error if an unexpected failure occurs during retrieval.
   */
  async getUserById({ id }: UserDto): Promise<User | null> {
    try {
      return await this.userRepository.findUserById({ id });
    } catch (error) {
      console.error(
        `[UserService] Failed to retrieve user by ID: ${id}`,
        error,
      );
      throw new Error("Failed to retrieve user");
    }
  }
}
