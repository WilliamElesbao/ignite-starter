import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

// Set environment variables BEFORE any imports
process.env.RESEND_API_KEY = "re_test_mock_api_key";
process.env.EMAIL_FROM = "test@example.com";
process.env.EMAIL_TO = "recipient@example.com";
process.env.WEB_URL = "http://localhost:3000";

// Mock the Resend class before any imports using a factory function
vi.mock("resend", () => {
  const mockSendFn = vi.fn();
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: mockSendFn,
      },
    })),
    __mockSend: mockSendFn, // Export for test access
  };
});

// Mock the WelcomeEmail component
vi.mock("@repo/emails/templates", () => ({
  WelcomeEmail: vi.fn(() => "MockedWelcomeEmail"),
}));

// Now import the modules
import { Resend } from "resend";
import { AppError } from "../../../shared/errors/app-error";
import { createMockLogger } from "../../../test/setup";
import { EmailErrorCode } from "../email.errors";
import { EmailService } from "../email.service";

// Get the mock send function
const getMockSend = () => {
  const resendInstance = new Resend("test");
  return resendInstance.emails.send as Mock;
};

describe("EmailService", () => {
  let emailService: EmailService;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockResendSend: Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create a fresh mock logger for each test
    mockLogger = createMockLogger();

    // Get reference to the mocked send function
    mockResendSend = getMockSend();

    // Create a new EmailService instance with the mock logger
    emailService = new EmailService(mockLogger);
  });

  describe("sendWelcomeEmail", () => {
    it("should call resend.emails.send with correct parameters", async () => {
      // Arrange
      const mockEmailData = { id: "email-123" };
      mockResendSend.mockResolvedValue({
        data: mockEmailData,
        error: null,
      });

      // Act
      await emailService.sendWelcomeEmail();

      // Assert
      expect(mockResendSend).toHaveBeenCalledWith({
        from: "test@example.com",
        to: "recipient@example.com",
        subject: "Welcome to Ignite Starter!",
        react: "MockedWelcomeEmail", // The mocked WelcomeEmail returns this string
      });
    });

    it("should log success message on successful send", async () => {
      // Arrange
      const mockEmailData = { id: "email-123" };
      mockResendSend.mockResolvedValue({
        data: mockEmailData,
        error: null,
      });

      // Act
      await emailService.sendWelcomeEmail();

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Welcome email sent",
        provider: "resend",
        to: "recipient@example.com",
      });
    });

    it("should return email data on successful send", async () => {
      // Arrange
      const mockEmailData = { id: "email-123" };
      mockResendSend.mockResolvedValue({
        data: mockEmailData,
        error: null,
      });

      // Act
      const result = await emailService.sendWelcomeEmail();

      // Assert
      expect(result).toEqual(mockEmailData);
    });

    it("should throw AppError with EMAIL_PROVIDER_ERROR when Resend returns error", async () => {
      // Arrange
      const mockError = { message: "Invalid API key" };
      mockResendSend.mockResolvedValue({
        data: null,
        error: mockError,
      });

      // Act & Assert
      await expect(emailService.sendWelcomeEmail()).rejects.toThrow(AppError);

      try {
        await emailService.sendWelcomeEmail();
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe(
          EmailErrorCode.EMAIL_PROVIDER_ERROR,
        );
        expect((error as AppError).status).toBe(502);
        expect((error as AppError).message).toBe("Failed to send email");
        expect((error as AppError).details).toEqual(mockError);
      }
    });

    it("should log error details when Resend returns error", async () => {
      // Arrange
      const mockError = { message: "Invalid API key" };
      mockResendSend.mockResolvedValue({
        data: null,
        error: mockError,
      });

      // Act
      try {
        await emailService.sendWelcomeEmail();
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: "Email provider returned an error",
        provider: "resend",
        to: "recipient@example.com",
        error: mockError,
      });
    });

    it("should throw AppError with EMAIL_SEND_FAILED when exception occurs during send", async () => {
      // Arrange
      const mockException = new Error("Network error");
      mockResendSend.mockRejectedValue(mockException);

      // Act & Assert
      await expect(emailService.sendWelcomeEmail()).rejects.toThrow(AppError);

      try {
        await emailService.sendWelcomeEmail();
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe(EmailErrorCode.EMAIL_SEND_FAILED);
        expect((error as AppError).status).toBe(500);
        expect((error as AppError).message).toBe("Failed to send email");
      }
    });

    it("should log error when exception occurs during send", async () => {
      // Arrange
      const mockException = new Error("Network error");
      mockResendSend.mockRejectedValue(mockException);

      // Act
      try {
        await emailService.sendWelcomeEmail();
      } catch {
        // Expected to throw
      }

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: "Failed to send welcome email",
        provider: "resend",
        to: "recipient@example.com",
        error: mockException, // The original error is logged before wrapping
      });
    });

    it("should use correct EMAIL_FROM environment variable", async () => {
      // Arrange
      const mockEmailData = { id: "email-123" };
      mockResendSend.mockResolvedValue({
        data: mockEmailData,
        error: null,
      });

      // Act
      await emailService.sendWelcomeEmail();

      // Assert
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "test@example.com",
        }),
      );
    });

    it("should use correct EMAIL_TO environment variable", async () => {
      // Arrange
      const mockEmailData = { id: "email-123" };
      mockResendSend.mockResolvedValue({
        data: mockEmailData,
        error: null,
      });

      // Act
      await emailService.sendWelcomeEmail();

      // Assert
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "recipient@example.com",
        }),
      );
    });

    it("should include correct subject in email", async () => {
      // Arrange
      const mockEmailData = { id: "email-123" };
      mockResendSend.mockResolvedValue({
        data: mockEmailData,
        error: null,
      });

      // Act
      await emailService.sendWelcomeEmail();

      // Assert
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Welcome to Ignite Starter!",
        }),
      );
    });

    it("should handle AppError being re-thrown in catch block", async () => {
      // Arrange
      const originalAppError = AppError.fromCatalog({
        code: EmailErrorCode.EMAIL_PROVIDER_ERROR,
        catalog: {
          [EmailErrorCode.EMAIL_PROVIDER_ERROR]: {
            message: "Provider error",
            status: 502,
          },
        },
      });

      mockResendSend.mockRejectedValue(originalAppError);

      // Act & Assert
      await expect(emailService.sendWelcomeEmail()).rejects.toThrow(AppError);

      try {
        await emailService.sendWelcomeEmail();
      } catch (error) {
        // Should preserve the original AppError
        expect(error).toBe(originalAppError);
        expect((error as AppError).code).toBe(
          EmailErrorCode.EMAIL_PROVIDER_ERROR,
        );
      }
    });

    it("should log both error scenarios separately", async () => {
      // Arrange - Test provider error logging
      const mockProviderError = { message: "Invalid API key" };
      mockResendSend.mockResolvedValue({
        data: null,
        error: mockProviderError,
      });

      // Act
      try {
        await emailService.sendWelcomeEmail();
      } catch {
        // Expected to throw
      }

      // Assert - Should log provider error
      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: "Email provider returned an error",
        provider: "resend",
        to: "recipient@example.com",
        error: mockProviderError,
      });

      // Reset mocks for second scenario
      vi.clearAllMocks();

      // Arrange - Test exception error logging
      const mockException = new Error("Network error");
      mockResendSend.mockRejectedValue(mockException);

      // Act
      try {
        await emailService.sendWelcomeEmail();
      } catch {
        // Expected to throw
      }

      // Assert - Should log send failure
      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: "Failed to send welcome email",
        provider: "resend",
        to: "recipient@example.com",
        error: mockException, // The original error is logged before wrapping
      });
    });
  });
});
