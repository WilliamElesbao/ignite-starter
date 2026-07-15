/**
 * @vitest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/better-auth/auth-client";
import { createMockSignInValues } from "@/test/factories/auth-factory";
import { useSignInForm } from "./use-sign-in-form";

// Mock authClient
vi.mock("@/lib/better-auth/auth-client", () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
  },
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "toast.login-failed": "Login failed",
      "email.please-enter-a-valid-email": "Please enter a valid email",
      "password.password-is-required": "Password is required",
    };
    return translations[key] || key;
  },
}));

describe("useSignInForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => useSignInForm());

      expect(result.current.form).toBeDefined();
      expect(result.current.onSubmit).toBeDefined();
      expect(result.current.form.getValues()).toEqual({
        email: "",
        password: "",
      });
    });

    it("should initialize form with onSubmit mode", () => {
      const { result } = renderHook(() => useSignInForm());

      // The form should be in onSubmit mode (validation happens on submit)
      expect(result.current.form.formState.isSubmitted).toBe(false);
    });
  });

  describe("successful authentication", () => {
    it("should call authClient.signIn.email with correct parameters", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;
      mockSignInEmail.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSignInForm());
      const values = createMockSignInValues({
        email: "test@example.com",
        password: "password123",
      });

      await result.current.onSubmit(values);

      expect(mockSignInEmail).toHaveBeenCalledWith(
        {
          email: "test@example.com",
          password: "password123",
          callbackURL: "http://localhost:3000",
        },
        expect.objectContaining({
          onError: expect.any(Function),
        }),
      );
    });

    it("should include correct callbackURL from environment variable", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;
      mockSignInEmail.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSignInForm());
      const values = createMockSignInValues();

      await result.current.onSubmit(values);

      expect(mockSignInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          callbackURL: "http://localhost:3000",
        }),
        expect.any(Object),
      );
    });

    it("should use fallback callbackURL when NEXT_PUBLIC_BASE_URL is not set", async () => {
      const originalEnv = process.env.NEXT_PUBLIC_BASE_URL;
      delete process.env.NEXT_PUBLIC_BASE_URL;

      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;
      mockSignInEmail.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSignInForm());
      const values = createMockSignInValues();

      await result.current.onSubmit(values);

      expect(mockSignInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          callbackURL: "http://localhost:3000",
        }),
        expect.any(Object),
      );

      // Restore environment variable
      process.env.NEXT_PUBLIC_BASE_URL = originalEnv;
    });
  });

  describe("failed authentication", () => {
    it("should display error toast when authentication fails", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;
      const mockToastError = toast.error as ReturnType<typeof vi.fn>;

      // Mock authClient to call onError callback
      mockSignInEmail.mockImplementation(async (_, options) => {
        if (options?.onError) {
          options.onError({
            error: {
              message: "Invalid credentials",
              status: 401,
            },
          });
        }
      });

      const { result } = renderHook(() => useSignInForm());
      const values = createMockSignInValues({
        email: "test@example.com",
        password: "wrongpassword",
      });

      await result.current.onSubmit(values);

      expect(mockToastError).toHaveBeenCalledWith("Login failed", {
        description: "Invalid credentials",
      });
    });

    it("should display error toast with different error messages", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;
      const mockToastError = toast.error as ReturnType<typeof vi.fn>;

      const errorMessages = [
        "User not found",
        "Account is locked",
        "Too many login attempts",
      ];

      for (const errorMessage of errorMessages) {
        vi.clearAllMocks();

        mockSignInEmail.mockImplementation(async (_, options) => {
          if (options?.onError) {
            options.onError({
              error: {
                message: errorMessage,
                status: 401,
              },
            });
          }
        });

        const { result } = renderHook(() => useSignInForm());
        const values = createMockSignInValues();

        await result.current.onSubmit(values);

        expect(mockToastError).toHaveBeenCalledWith("Login failed", {
          description: errorMessage,
        });
      }
    });

    it("should handle error with empty message", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;
      const mockToastError = toast.error as ReturnType<typeof vi.fn>;

      mockSignInEmail.mockImplementation(async (_, options) => {
        if (options?.onError) {
          options.onError({
            error: {
              message: "",
              status: 401,
            },
          });
        }
      });

      const { result } = renderHook(() => useSignInForm());
      const values = createMockSignInValues();

      await result.current.onSubmit(values);

      expect(mockToastError).toHaveBeenCalledWith("Login failed", {
        description: "",
      });
    });
  });

  describe("form validation", () => {
    it("should prevent submission with invalid email", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;

      const { result } = renderHook(() => useSignInForm());

      // Set invalid email
      result.current.form.setValue("email", "invalid-email");
      result.current.form.setValue("password", "password123");

      // Trigger validation
      const isValid = await result.current.form.trigger();

      expect(isValid).toBe(false);
      expect(mockSignInEmail).not.toHaveBeenCalled();
    });

    it("should prevent submission with empty password", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;

      const { result } = renderHook(() => useSignInForm());

      // Set valid email but empty password
      result.current.form.setValue("email", "test@example.com");
      result.current.form.setValue("password", "");

      // Trigger validation
      const isValid = await result.current.form.trigger();

      expect(isValid).toBe(false);
      expect(mockSignInEmail).not.toHaveBeenCalled();
    });

    it("should allow submission with valid email and password", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;
      mockSignInEmail.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSignInForm());

      // Set valid values
      result.current.form.setValue("email", "test@example.com");
      result.current.form.setValue("password", "password123");

      // Trigger validation
      const isValid = await result.current.form.trigger();

      expect(isValid).toBe(true);

      // Now submit
      await result.current.onSubmit({
        email: "test@example.com",
        password: "password123",
      });

      expect(mockSignInEmail).toHaveBeenCalled();
    });
  });

  describe("exception handling", () => {
    it("should handle exception thrown by authClient", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock authClient to throw an exception
      mockSignInEmail.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useSignInForm());
      const values = createMockSignInValues();

      // The onSubmit function should not throw, but the promise will reject
      await expect(result.current.onSubmit(values)).rejects.toThrow(
        "Network error",
      );

      consoleErrorSpy.mockRestore();
    });

    it("should handle timeout errors", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;

      mockSignInEmail.mockRejectedValue(new Error("Request timeout"));

      const { result } = renderHook(() => useSignInForm());
      const values = createMockSignInValues();

      await expect(result.current.onSubmit(values)).rejects.toThrow(
        "Request timeout",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle submission with trimmed email", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;
      mockSignInEmail.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSignInForm());
      const values = createMockSignInValues({
        email: "  test@example.com  ",
        password: "password123",
      });

      await result.current.onSubmit(values);

      // authClient should receive the email as-is (trimming is not done by the hook)
      expect(mockSignInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "  test@example.com  ",
        }),
        expect.any(Object),
      );
    });

    it("should handle multiple rapid submissions", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;
      mockSignInEmail.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSignInForm());
      const values = createMockSignInValues();

      // Submit multiple times rapidly
      const promise1 = result.current.onSubmit(values);
      const promise2 = result.current.onSubmit(values);
      const promise3 = result.current.onSubmit(values);

      await Promise.all([promise1, promise2, promise3]);

      // All submissions should go through
      expect(mockSignInEmail).toHaveBeenCalledTimes(3);
    });

    it("should handle special characters in password", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;
      mockSignInEmail.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSignInForm());
      const values = createMockSignInValues({
        email: "test@example.com",
        password: "P@ssw0rd!#$%^&*()",
      });

      await result.current.onSubmit(values);

      expect(mockSignInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          password: "P@ssw0rd!#$%^&*()",
        }),
        expect.any(Object),
      );
    });

    it("should handle very long email addresses", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;
      mockSignInEmail.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSignInForm());
      const longEmail = `${"a".repeat(64)}@${"b".repeat(63)}.com`;
      const values = createMockSignInValues({
        email: longEmail,
        password: "password123",
      });

      await result.current.onSubmit(values);

      expect(mockSignInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: longEmail,
        }),
        expect.any(Object),
      );
    });
  });

  describe("integration with form state", () => {
    it("should maintain form state after successful submission", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;
      mockSignInEmail.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSignInForm());
      const values = createMockSignInValues({
        email: "test@example.com",
        password: "password123",
      });

      // Set form values
      result.current.form.setValue("email", values.email);
      result.current.form.setValue("password", values.password);

      await result.current.onSubmit(values);

      // Form values should still be present
      expect(result.current.form.getValues()).toEqual(values);
    });

    it("should maintain form state after failed submission", async () => {
      const mockSignInEmail = authClient.signIn.email as ReturnType<
        typeof vi.fn
      >;

      mockSignInEmail.mockImplementation(async (_, options) => {
        if (options?.onError) {
          options.onError({
            error: {
              message: "Invalid credentials",
              status: 401,
            },
          });
        }
      });

      const { result } = renderHook(() => useSignInForm());
      const values = createMockSignInValues({
        email: "test@example.com",
        password: "wrongpassword",
      });

      // Set form values
      result.current.form.setValue("email", values.email);
      result.current.form.setValue("password", values.password);

      await result.current.onSubmit(values);

      // Form values should still be present after error
      expect(result.current.form.getValues()).toEqual(values);
    });
  });
});