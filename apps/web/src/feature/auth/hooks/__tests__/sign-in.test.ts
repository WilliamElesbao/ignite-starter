/**
 * @vitest-environment jsdom
 */

import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WELCOME_TOAST } from "@/constants";
import { authClient } from "@/lib/better-auth/auth-client";
import { mockSessionStorage } from "@/test/setup";
import { signInWithGoogle } from "../sign-in";

// Mock authClient
vi.mock("@/lib/better-auth/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
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

describe("signInWithGoogle", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.clear();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should call authClient.signIn.social with provider "google"', async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    mockSignInSocial.mockResolvedValue(undefined);

    await signInWithGoogle();

    expect(mockSignInSocial).toHaveBeenCalledWith(
      {
        provider: "google",
        callbackURL: "http://localhost:3000",
      },
      expect.objectContaining({
        onError: expect.any(Function),
      }),
    );
  });

  it("should store welcome toast flag before authentication", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    mockSignInSocial.mockResolvedValue(undefined);

    await signInWithGoogle();

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      WELCOME_TOAST.key,
      WELCOME_TOAST.value,
    );
  });

  it("should include correct callbackURL", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    mockSignInSocial.mockResolvedValue(undefined);

    await signInWithGoogle();

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackURL: "http://localhost:3000",
      }),
      expect.any(Object),
    );
  });

  it("should display error toast on failure", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    const mockToastError = toast.error as ReturnType<typeof vi.fn>;

    // Simulate onError callback being invoked
    mockSignInSocial.mockImplementation(async (_, options) => {
      if (options?.onError) {
        options.onError({
          error: {
            message: "Google authentication failed",
          },
        });
      }
    });

    await signInWithGoogle();

    expect(mockToastError).toHaveBeenCalledWith("Google sign-in failed", {
      description: "Google authentication failed",
    });
  });

  it("should log and re-throw exceptions", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    const testError = new Error("Network error");

    mockSignInSocial.mockRejectedValue(testError);

    await expect(signInWithGoogle()).rejects.toThrow("Network error");

    expect(consoleErrorSpy).toHaveBeenCalledWith("[signIn] error:", testError);
  });

  it("should use NEXT_PUBLIC_BASE_URL from environment", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    mockSignInSocial.mockResolvedValue(undefined);

    // Environment variable is already set in setup.ts
    await signInWithGoogle();

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackURL: process.env.NEXT_PUBLIC_BASE_URL,
      }),
      expect.any(Object),
    );
  });

  it("should handle missing NEXT_PUBLIC_BASE_URL gracefully", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    mockSignInSocial.mockResolvedValue(undefined);

    // Temporarily remove the environment variable
    const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;

    await signInWithGoogle();

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackURL: "http://localhost:3000",
      }),
      expect.any(Object),
    );

    // Restore the environment variable
    process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
  });

  it("should set welcome toast flag before calling authClient", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    const callOrder: string[] = [];

    // Track the order of calls
    const mockSetItem = mockSessionStorage.setItem as ReturnType<typeof vi.fn>;
    mockSetItem.mockImplementation(() => {
      callOrder.push("sessionStorage.setItem");
    });

    mockSignInSocial.mockImplementation(async () => {
      callOrder.push("authClient.signIn.social");
    });

    await signInWithGoogle();

    expect(callOrder).toEqual([
      "sessionStorage.setItem",
      "authClient.signIn.social",
    ]);
  });

  it("should pass error context to toast notification", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    const mockToastError = toast.error as ReturnType<typeof vi.fn>;

    const errorMessage = "OAuth provider returned an error";

    mockSignInSocial.mockImplementation(async (_, options) => {
      if (options?.onError) {
        options.onError({
          error: {
            message: errorMessage,
          },
        });
      }
    });

    await signInWithGoogle();

    expect(mockToastError).toHaveBeenCalledWith(
      "Google sign-in failed",
      expect.objectContaining({
        description: errorMessage,
      }),
    );
  });

  it("should handle different error messages from OAuth provider", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    const mockToastError = toast.error as ReturnType<typeof vi.fn>;

    const errorMessages = [
      "Access denied",
      "Invalid OAuth state",
      "User cancelled authentication",
    ];

    for (const errorMessage of errorMessages) {
      vi.clearAllMocks();

      mockSignInSocial.mockImplementation(async (_, options) => {
        if (options?.onError) {
          options.onError({
            error: {
              message: errorMessage,
            },
          });
        }
      });

      await signInWithGoogle();

      expect(mockToastError).toHaveBeenCalledWith("Google sign-in failed", {
        description: errorMessage,
      });
    }
  });

  it("should handle empty error message", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    const mockToastError = toast.error as ReturnType<typeof vi.fn>;

    mockSignInSocial.mockImplementation(async (_, options) => {
      if (options?.onError) {
        options.onError({
          error: {
            message: "",
          },
        });
      }
    });

    await signInWithGoogle();

    expect(mockToastError).toHaveBeenCalledWith("Google sign-in failed", {
      description: "",
    });
  });

  it("should still set welcome toast flag even if authentication throws", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;

    mockSignInSocial.mockRejectedValue(new Error("Network error"));

    try {
      await signInWithGoogle();
    } catch {
      // Expected to throw
    }

    // Welcome toast should still be set before the error
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      WELCOME_TOAST.key,
      WELCOME_TOAST.value,
    );
  });

  it("should log exception details before re-throwing", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    const testError = new Error("Connection timeout");

    mockSignInSocial.mockRejectedValue(testError);

    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      expect(error).toBe(testError);
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith("[signIn] error:", testError);
  });
});
