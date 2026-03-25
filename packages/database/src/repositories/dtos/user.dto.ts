import z from "zod";

/**
 * Data Transfer Object representing a User ID.
 * Used for validating user-related input data.
 */
export const UserDto = z.object({
  id: z.uuid(),
});

export type UserDto = z.infer<typeof UserDto>;
