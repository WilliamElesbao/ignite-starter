import type { Logger } from "pino";
import { vi } from "vitest";

// Mock environment variables for both process.env and Bun.env
const envVars = {
  EMAIL_FROM: "test@example.com",
  EMAIL_TO: "recipient@example.com",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  REDIS_URL: "redis://localhost:6379",
  WEB_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "test-google-client-id",
  GOOGLE_CLIENT_SECRET: "test-google-client-secret",
  STRIPE_SECRET_KEY: "sk_test_mock",
  STRIPE_WEBHOOK_SECRET: "whsec_test_mock",
  RESEND_API_KEY: "re_test_mock_api_key",
};

// Set for process.env
Object.assign(process.env, envVars);

// Set for Bun.env if it exists
if (typeof Bun !== "undefined" && Bun.env) {
  Object.assign(Bun.env, envVars);
}

/**
 * Creates a mock logger instance for testing.
 * All logger methods are mocked with vi.fn() and can be used to verify logging calls.
 *
 * @returns A mock logger that implements the pino Logger interface
 *
 * @example
 * ```typescript
 * const mockLogger = createMockLogger();
 *
 * // Use in tests
 * const service = new EmailService(mockLogger);
 * await service.sendEmail();
 *
 * // Verify logging
 * expect(mockLogger.info).toHaveBeenCalledWith(
 *   expect.objectContaining({ msg: 'Email sent successfully' })
 * );
 * ```
 */
export const createMockLogger = (): Logger => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
    level: "info",
    silent: vi.fn(),
  } as unknown as Logger;

  // Make child() return the same mock logger instance (not recursive)
  mockLogger.child = vi.fn().mockReturnValue(mockLogger);

  return mockLogger;
};

// Export as global utility
export { createMockLogger as createMockLoggerGlobal };
