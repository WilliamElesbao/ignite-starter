/**
 * @vitest-environment jsdom
 */

import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/better-auth/auth-client";
import { logger } from "@/utils/logger";
import { signInWithGoogle } from "./sign-in";

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

// Mock logger
vi.mock("@/utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("signInWithGoogle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call authClient.signIn.social with provider "google"', async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    mockSignInSocial.mockResolvedValue({ error: null });

    await signInWithGoogle();

    expect(mockSignInSocial).toHaveBeenCalledWith(
      {
        provider: "google",
        callbackURL: "http://localhost:3000/subscription",
      },
      expect.objectContaining({
        onError: expect.any(Function),
      }),
    );
  });

  it("should include correct callbackURL", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    mockSignInSocial.mockResolvedValue({ error: null });

    await signInWithGoogle();

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackURL: "http://localhost:3000/subscription",
      }),
      expect.any(Object),
    );
  });

  it("should use NEXT_PUBLIC_BASE_URL from environment", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    mockSignInSocial.mockResolvedValue({ error: null });

    // Environment variable is already set in setup.ts
    await signInWithGoogle();

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription`,
      }),
      expect.any(Object),
    );
  });

  it("should handle missing NEXT_PUBLIC_BASE_URL gracefully", async () => {
    const mockSignInSocial = authClient.signIn.social as ReturnType<
      typeof vi.fn
    >;
    mockSignInSocial.mockResolvedValue({ error: null });

    // Temporarily remove the environment variable
    const originalBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_BASE_URL;

    await signInWithGoogle();

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackURL: "http://localhost:3000/subscription",
      }),
      expect.any(Object),
    );

    // Restore the environment variable
    process.env.NEXT_PUBLIC_BASE_URL = originalBaseUrl;
  });

  describe("when the API returns an error in the response", () => {
    it("should display error toast via the onError callback", async () => {
      const mockSignInSocial = authClient.signIn.social as ReturnType<
        typeof vi.fn
      >;
      const mockToastError = toast.error as ReturnType<typeof vi.fn>;
      const apiError = { message: "Google authentication failed" };

      // better-auth invokes onError AND resolves the promise with { error }
      mockSignInSocial.mockImplementation(async (_, options) => {
        options?.onError?.({ error: apiError });
        return { error: apiError };
      });

      try {
        await signInWithGoogle();
      } catch {
        // Expected: signInWithGoogle throws when the response contains an error
      }

      expect(mockToastError).toHaveBeenCalledWith("Google sign-in failed", {
        description: apiError.message,
      });
    });

    it("should log the error via logger and throw it", async () => {
      const mockSignInSocial = authClient.signIn.social as ReturnType<
        typeof vi.fn
      >;
      const apiError = { message: "Invalid credentials" };
      mockSignInSocial.mockResolvedValue({ error: apiError });

      await expect(signInWithGoogle()).rejects.toEqual(apiError);

      expect(logger.error).toHaveBeenCalledWith("[signIn] error:", apiError);
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
        const apiError = { message: errorMessage };

        mockSignInSocial.mockImplementation(async (_, options) => {
          options?.onError?.({ error: apiError });
          return { error: apiError };
        });

        try {
          await signInWithGoogle();
        } catch {
          // Expected: throws after logging
        }

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
      const apiError = { message: "" };

      mockSignInSocial.mockImplementation(async (_, options) => {
        options?.onError?.({ error: apiError });
        return { error: apiError };
      });

      try {
        await signInWithGoogle();
      } catch {
        // Expected: throws after logging
      }

      expect(mockToastError).toHaveBeenCalledWith("Google sign-in failed", {
        description: "",
      });
    });
  });

  describe("when authClient.signIn.social rejects outright", () => {
    it("should propagate the exception without logging it", async () => {
      const mockSignInSocial = authClient.signIn.social as ReturnType<
        typeof vi.fn
      >;
      const testError = new Error("Connection timeout");
      mockSignInSocial.mockRejectedValue(testError);

      await expect(signInWithGoogle()).rejects.toThrow("Connection timeout");

      // No try/catch wraps the call in signInWithGoogle, so a rejected
      // promise propagates directly — logger.error is only reached when
      // the API responds successfully but with an `error` field.
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});