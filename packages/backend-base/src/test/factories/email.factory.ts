import type { Job } from "bullmq";
import { vi } from "vitest";
import type { WelcomeEmailData } from "../../plugins/queue/email-queue.worker";

/**
 * Create a mock BullMQ job for testing
 *
 * @param overrides - Partial job properties to override defaults
 * @returns Mock job object with updateProgress method
 */
export const createMockEmailJob = (
  overrides: Partial<Job<WelcomeEmailData>> = {},
): Job<WelcomeEmailData> => {
  const defaultJob = {
    id: "job-123",
    name: "send-welcome-email",
    data: {
      userId: "user-123",
      email: "test@example.com",
    },
    updateProgress: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return defaultJob as Job<WelcomeEmailData>;
};

/**
 * Create a mock Resend API response for testing
 *
 * @param overrides - Partial response properties to override defaults
 * @returns Mock Resend response object
 */
export const createMockResendResponse = (
  overrides: {
    data?: { id?: string; [key: string]: unknown } | null;
    error?: { message?: string; [key: string]: unknown } | null;
  } = {},
) => ({
  data: overrides.data !== undefined ? overrides.data : { id: "email-123" },
  error: overrides.error !== undefined ? overrides.error : null,
});
