import type { User } from "@repo/db";
import type { Static } from "elysia";
import type { db } from "../shared/shared.plugin";
import type { UserResponseDto } from "./dtos/user-response.dto";

type UserResponse = Static<typeof UserResponseDto>;

export class UserService {
  constructor(private readonly db: db) {}

  async getUserById({ id }: Pick<User, "id">): Promise<UserResponse | null> {
    const user = await this.db.user.findUnique({ where: { id } });
    return toUserResponseDto(user);
  }
}

const toUserResponseDto = (user: User | null): UserResponse | null => {
  if (!user) return null;

  return {
    ...user,
    otpExpiresAt: user.otpExpiresAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLogin: user.lastLogin?.toISOString() ?? null,
  };
};
