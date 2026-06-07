import { beforeEach, describe, expect, it, vi } from "vitest";

// Set environment variables BEFORE any imports
process.env.RESEND_API_KEY = "re_test_mock_api_key";
process.env.EMAIL_FROM = "test@example.com";
process.env.EMAIL_TO = "recipient@example.com";
process.env.WEB_URL = "http://localhost:3000";

// Mock the Resend class before any imports using a factory function
vi.mock("resend", () => {
  class MockResend {
    emails = {
      send: vi.fn(),
    };
    constructor(apiKey: string) {
      // Store for testing if needed
      this.apiKey = apiKey;
    }
    apiKey: string;
  }
  return {
    Resend: MockResend,
  };
});

// Mock the WelcomeEmail component
vi.mock("@repo/emails/templates", () => ({
  WelcomeEmail: vi.fn(() => "MockedWelcomeEmail"),
}));

import { resend } from "../../lib/resend";
import { AppError } from "../../shared/errors/app-error";
import { createMockLogger } from "../../test/setup";
import { EmailErrorCode } from "./email.errors";
import { EmailService } from "./email.service";

describe("EmailService", () => {
  let emailService: EmailService;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create a fresh mock logger for each test
    mockLogger = createMockLogger();

    // Create a new EmailService instance with the mock logger
    emailService = new EmailService(mockLogger);
  });

  describe("environment variables", () => {
    it("should use EMAIL_FROM from environment when set", async () => {
      // This test verifies the module loads with env vars set
      expect(process.env.EMAIL_FROM).toBe("test@example.com");

      const service = new EmailService(mockLogger);
      const mockEmailData = { id: "email-123" };
      const sendSpy = vi.spyOn(resend.emails, "send").mockResolvedValue({
        data: mockEmailData,
        error: null,
        headers: null,
      });

      await service.sendWelcomeEmail();

      // Verify EMAIL_FROM was used in the call
      expect(resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "test@example.com",
        }),
      );
      sendSpy.mockRestore();
    });

    it("should use EMAIL_TO from environment when set", async () => {
      // This test verifies the module loads with env vars set
      expect(process.env.EMAIL_TO).toBe("recipient@example.com");

      const service = new EmailService(mockLogger);
      const mockEmailData = { id: "email-123" };
      const sendSpy = vi.spyOn(resend.emails, "send").mockResolvedValue({
        data: mockEmailData,
        error: null,
        headers: null,
      });

      await service.sendWelcomeEmail();

      // Verify EMAIL_TO was used in the call
      expect(resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "recipient@example.com",
        }),
      );
      sendSpy.mockRestore();
    });

    it("should use empty string when EMAIL_FROM is undefined", async () => {
      const originalValue = process.env.EMAIL_FROM;
      delete process.env.EMAIL_FROM;

      const service = new EmailService(mockLogger);
      const mockEmailData = { id: "email-123" };
      const sendSpy = vi.spyOn(resend.emails, "send").mockResolvedValue({
        data: mockEmailData,
        error: null,
        headers: null,
      });

      await service.sendWelcomeEmail();

      // Verify empty string was used when env var is undefined
      expect(resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "",
        }),
      );

      sendSpy.mockRestore();
      process.env.EMAIL_FROM = originalValue;
    });

    it("should use empty string when EMAIL_TO is undefined", async () => {
      const originalValue = process.env.EMAIL_TO;
      delete process.env.EMAIL_TO;

      const service = new EmailService(mockLogger);
      const mockEmailData = { id: "email-123" };
      const sendSpy = vi.spyOn(resend.emails, "send").mockResolvedValue({
        data: mockEmailData,
        error: null,
        headers: null,
      });

      await service.sendWelcomeEmail();

      // Verify empty string was used when env var is undefined
      expect(resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "",
        }),
      );

      sendSpy.mockRestore();
      process.env.EMAIL_TO = originalValue;
    });
  });

  describe("sendWelcomeEmail", () => {
    it("should call resend.emails.send with correct parameters", async () => {
      // Arrange
      const mockEmailData = { id: "email-123" };
      const sendSpy = vi.spyOn(resend.emails, "send").mockResolvedValue({
        data: mockEmailData,
        error: null,
        headers: null,
      });

      // Act
      await emailService.sendWelcomeEmail();

      // Assert
      expect(resend.emails.send).toHaveBeenCalledWith({
        from: "test@example.com",
        to: "recipient@example.com",
        subject: "Welcome to Ignite Starter!",
        react: "MockedWelcomeEmail", // The mocked WelcomeEmail returns this string
      });
      sendSpy.mockRestore();
    });

    it("should log success message on successful send", async () => {
      // Arrange
      const mockEmailData = { id: "email-123" };
      const sendSpy = vi.spyOn(resend.emails, "send").mockResolvedValue({
        data: mockEmailData,
        error: null,
        headers: null,
      });

      // Act
      await emailService.sendWelcomeEmail();

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Welcome email sent",
        provider: "resend",
        to: "recipient@example.com",
      });
      sendSpy.mockRestore();
    });

    it("should return email data on successful send", async () => {
      // Arrange
      const mockEmailData = { id: "email-123" };
      const sendSpy = vi.spyOn(resend.emails, "send").mockResolvedValue({
        data: mockEmailData,
        error: null,
        headers: null,
      });

      // Act
      const result = await emailService.sendWelcomeEmail();

      // Assert
      expect(result).toEqual(mockEmailData);
      sendSpy.mockRestore();
    });

    it("should throw AppError with EMAIL_PROVIDER_ERROR when Resend returns error", async () => {
      // Arrange
      const mockError = {
        message: "Invalid API key",
        name: "invalid_api_key" as const,
        statusCode: 422,
      };
      const sendSpy = vi.spyOn(resend.emails, "send").mockResolvedValue({
        data: null,
        error: mockError,
        headers: null,
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
      sendSpy.mockRestore();
    });

    it("should log error details when Resend returns error", async () => {
      // Arrange
      const mockError = {
        message: "Invalid API key",
        name: "invalid_api_key" as const,
        statusCode: 422,
      };
      const sendSpy = vi.spyOn(resend.emails, "send").mockResolvedValue({
        data: null,
        error: mockError,
        headers: null,
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
      sendSpy.mockRestore();
    });

    it("should throw AppError with EMAIL_SEND_FAILED when exception occurs during send", async () => {
      // Arrange
      const mockException = new Error("Network error");
      const sendSpy = vi
        .spyOn(resend.emails, "send")
        .mockRejectedValue(mockException);

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
      sendSpy.mockRestore();
    });

    it("should log error when exception occurs during send", async () => {
      // Arrange
      const mockException = new Error("Network error");
      const sendSpy = vi
        .spyOn(resend.emails, "send")
        .mockRejectedValue(mockException);

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
      sendSpy.mockRestore();
    });

    it("should use correct EMAIL_FROM environment variable", async () => {
      // Arrange
      const mockEmailData = { id: "email-123" };
      const sendSpy = vi.spyOn(resend.emails, "send").mockResolvedValue({
        data: mockEmailData,
        error: null,
        headers: null,
      });

      // Act
      await emailService.sendWelcomeEmail();

      // Assert
      expect(resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "test@example.com",
        }),
      );
      sendSpy.mockRestore();
    });

    it("should use correct EMAIL_TO environment variable", async () => {
      // Arrange
      const mockEmailData = { id: "email-123" };
      const sendSpy = vi.spyOn(resend.emails, "send").mockResolvedValue({
        data: mockEmailData,
        error: null,
        headers: null,
      });

      // Act
      await emailService.sendWelcomeEmail();

      // Assert
      expect(resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "recipient@example.com",
        }),
      );
      sendSpy.mockRestore();
    });

    it("should include correct subject in email", async () => {
      // Arrange
      const mockEmailData = { id: "email-123" };
      const sendSpy = vi.spyOn(resend.emails, "send").mockResolvedValue({
        data: mockEmailData,
        error: null,
        headers: null,
      });

      // Act
      await emailService.sendWelcomeEmail();

      // Assert
      expect(resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Welcome to Ignite Starter!",
        }),
      );
      sendSpy.mockRestore();
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

      const sendSpy = vi
        .spyOn(resend.emails, "send")
        .mockRejectedValue(originalAppError);

      // Act & Assert
      await expect(emailService.sendWelcomeEmail()).rejects.toThrow(AppError);

      try {
        await emailService.sendWelcomeEmail();
      } catch (error) {
        // Should preserve the original AppError
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe(
          EmailErrorCode.EMAIL_PROVIDER_ERROR,
        );
      }
      sendSpy.mockRestore();
    });

    it("should call AppError.fromUnknown for non-AppError exceptions", async () => {
      // Arrange
      const genericError = new Error("Generic error");
      const sendSpy = vi
        .spyOn(resend.emails, "send")
        .mockRejectedValue(genericError);

      // Act & Assert
      await expect(emailService.sendWelcomeEmail()).rejects.toThrow(AppError);

      try {
        await emailService.sendWelcomeEmail();
      } catch (error) {
        // Should wrap in AppError
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).code).toBe(EmailErrorCode.EMAIL_SEND_FAILED);
      }
      sendSpy.mockRestore();
    });

    it("should log both error scenarios separately", async () => {
      // Arrange - Test provider error logging
      const mockProviderError = {
        message: "Invalid API key",
        name: "invalid_api_key" as const,
        statusCode: 422,
      };
      let sendSpy = vi.spyOn(resend.emails, "send").mockResolvedValue({
        data: null,
        error: mockProviderError,
        headers: null,
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
      sendSpy.mockRestore();

      // Reset mocks for second scenario
      vi.clearAllMocks();

      // Arrange - Test exception error logging
      const mockException = new Error("Network error");
      sendSpy = vi
        .spyOn(resend.emails, "send")
        .mockRejectedValue(mockException);

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
      sendSpy.mockRestore();
    });
  });
});
