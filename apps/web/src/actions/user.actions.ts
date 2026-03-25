"use server";

import { UserRepository } from "@/database/repositories";
import type { User } from "@/prisma/generated/prisma/client";
import { UserService } from "@/services";

/**
 * Server action to get user by ID
 *
 * This runs on the server side and has access to the database
 */
export async function getUserByIdAction({
  id,
}: Pick<User, "id">): Promise<User | null> {
  try {
    const userRepository = new UserRepository();
    const userService = new UserService(userRepository);

    return await userService.getUserById({ id });
  } catch (error) {
    console.error("[getUserByIdAction] Error fetching user:", error);
    return null;
  }
}
