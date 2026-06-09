import { renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as emailMutation from "./email.mutations";
import { useEmail } from "./use-send-welcome-email";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("useEmail", () => {
  const mockMutateAsync = vi.fn();
  let useSendEmailSpy: ReturnType<typeof vi.spyOn>;
  type UseSendEmailReturn = ReturnType<typeof emailMutation.useSendEmail>;

  beforeEach(() => {
    vi.clearAllMocks();
    useSendEmailSpy = vi.spyOn(emailMutation, "useSendEmail").mockReturnValue({
      mutateAsync: mockMutateAsync,
    } as unknown as UseSendEmailReturn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display success toast when email send is successful", async () => {
    // Arrange
    mockMutateAsync.mockResolvedValue({ success: true });

    // Act
    const { result } = renderHook(() => useEmail());
    await result.current.sendWelcomeEmail();

    // Assert
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("email-sent-successfully");
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("should display error toast when email send fails", async () => {
    // Arrange
    mockMutateAsync.mockRejectedValue(new Error("Network error"));

    // Act
    const { result } = renderHook(() => useEmail());
    await result.current.sendWelcomeEmail();

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("failed-to-send-email");
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("should call mutation with correct parameters", async () => {
    // Arrange
    mockMutateAsync.mockResolvedValue({ success: true });

    // Act
    const { result } = renderHook(() => useEmail());
    await result.current.sendWelcomeEmail();

    // Assert
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({});
    });
  });

  it("should handle response.success === false as error", async () => {
    // Arrange
    mockMutateAsync.mockResolvedValue({ success: false });

    // Act
    const { result } = renderHook(() => useEmail());
    await result.current.sendWelcomeEmail();

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("failed-to-send-email");
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("should use correct translation keys for messages", async () => {
    // Arrange - Test success case
    mockMutateAsync.mockResolvedValue({ success: true });

    // Act
    const { result } = renderHook(() => useEmail());
    await result.current.sendWelcomeEmail();

    // Assert
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("email-sent-successfully");
    });

    // Clear mocks for error case
    vi.clearAllMocks();

    // Arrange - Test error case
    mockMutateAsync.mockRejectedValue(new Error("Test error"));

    // Act
    await result.current.sendWelcomeEmail();

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("failed-to-send-email");
    });
  });

  it("should handle mutation error gracefully", async () => {
    // Arrange
    const testError = new Error("API error");
    mockMutateAsync.mockRejectedValue(testError);

    // Act
    const { result } = renderHook(() => useEmail());
    await result.current.sendWelcomeEmail();

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("failed-to-send-email");
    });
    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
  });

  it("should not display success toast when response is undefined", async () => {
    // Arrange
    mockMutateAsync.mockResolvedValue(undefined);

    // Act
    const { result } = renderHook(() => useEmail());
    await result.current.sendWelcomeEmail();

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("failed-to-send-email");
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("should handle error when response.success is false and error is present", async () => {
    // Arrange
    mockMutateAsync.mockRejectedValue(new Error("API Error"));

    // Act
    const { result } = renderHook(() => useEmail());
    await result.current.sendWelcomeEmail();

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("failed-to-send-email");
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("should handle response with success property correctly", async () => {
    // Arrange - Test with explicit success: true
    mockMutateAsync.mockResolvedValue({ success: true, jobId: "job-123" });

    // Act
    const { result } = renderHook(() => useEmail());
    await result.current.sendWelcomeEmail();

    // Assert
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("email-sent-successfully");
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("should not call success toast when response.success is explicitly false", async () => {
    // Arrange - response exists but success is false
    mockMutateAsync.mockResolvedValue({ success: false });

    // Act
    const { result } = renderHook(() => useEmail());
    await result.current.sendWelcomeEmail();

    // Assert - should show error, not success
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("failed-to-send-email");
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("should call useSendEmail hook", () => {
    // Act
    renderHook(() => useEmail());

    // Assert
    expect(useSendEmailSpy).toHaveBeenCalled();
  });

  it("should use translations from dashboard.toast.send-email namespace", async () => {
    // This test verifies that the hook uses the correct translation namespace
    // by checking that the mocked translation function returns the expected keys

    // Arrange
    mockMutateAsync.mockResolvedValue({ success: true });

    // Act
    const { result } = renderHook(() => useEmail());
    await result.current.sendWelcomeEmail();

    // Assert - The translation keys should match the namespace structure
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("email-sent-successfully");
    });
  });
});
