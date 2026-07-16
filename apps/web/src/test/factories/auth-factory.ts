import type { User } from "@repo/api/generated/api/types.gen";
import type { SignInFormValues } from "@/features/auth/sign-in/hooks/form-schema";

/**
 * Create a mock user object for testing
 *
 * @param overrides - Partial user properties to override defaults
 * @returns Mock user object
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-123",
  name: "Test User",
  email: "test@example.com",
  emailVerified: false,
  image: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  stripeCustomerId: undefined,
  ...overrides,
});

/**
 * Create mock sign-in form values for testing
 *
 * @param overrides - Partial form values to override defaults
 * @returns Mock sign-in form values
 */
export const createMockSignInValues = (
  overrides: Partial<SignInFormValues> = {},
): SignInFormValues => ({
  email: "test@example.com",
  password: "password123",
  ...overrides,
});
