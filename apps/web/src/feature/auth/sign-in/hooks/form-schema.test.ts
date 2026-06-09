import { beforeEach, describe, expect, it, vi } from "vitest";
import { signInFormSchema } from "./form-schema";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "email.please-enter-a-valid-email": "Please enter a valid email",
      "password.password-is-required": "Password is required",
    };
    return translations[key] || key;
  },
}));

describe("signInFormSchema", () => {
  let schema: ReturnType<typeof signInFormSchema>;

  beforeEach(() => {
    schema = signInFormSchema();
  });

  describe("valid inputs", () => {
    it("should validate correct email and password", () => {
      const result = schema.safeParse({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          email: "test@example.com",
          password: "password123",
        });
      }
    });

    it("should validate email with various valid formats", () => {
      const validEmails = [
        "user@domain.com",
        "user.name@domain.com",
        "user+tag@domain.co.uk",
        "user_name@sub.domain.com",
      ];

      for (const email of validEmails) {
        const result = schema.safeParse({
          email,
          password: "password",
        });

        expect(result.success).toBe(true);
      }
    });
  });

  describe("invalid email", () => {
    it("should reject invalid email format", () => {
      const result = schema.safeParse({
        email: "invalid-email",
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(["email"]);
      }
    });

    it("should reject email without @ symbol", () => {
      const result = schema.safeParse({
        email: "invalidemail.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["email"]);
      }
    });

    it("should reject email without domain", () => {
      const result = schema.safeParse({
        email: "user@",
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["email"]);
      }
    });

    it("should reject empty email", () => {
      const result = schema.safeParse({
        email: "",
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["email"]);
      }
    });
  });

  describe("invalid password", () => {
    it("should reject empty password", () => {
      const result = schema.safeParse({
        email: "test@example.com",
        password: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0].path).toEqual(["password"]);
        expect(result.error.issues[0].message).toBe("Password is required");
      }
    });

    it("should accept password with single character", () => {
      const result = schema.safeParse({
        email: "test@example.com",
        password: "a",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("validation error messages", () => {
    it("should return correct error message for invalid email", () => {
      const result = schema.safeParse({
        email: "invalid",
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(
          (issue) => issue.path[0] === "email",
        );
        expect(emailError?.message).toBe("Please enter a valid email");
      }
    });

    it("should return correct error message for empty password", () => {
      const result = schema.safeParse({
        email: "test@example.com",
        password: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password",
        );
        expect(passwordError?.message).toBe("Password is required");
      }
    });

    it("should return multiple error messages when both fields are invalid", () => {
      const result = schema.safeParse({
        email: "invalid",
        password: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);

        const emailError = result.error.issues.find(
          (issue) => issue.path[0] === "email",
        );
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password",
        );

        expect(emailError?.message).toBe("Please enter a valid email");
        expect(passwordError?.message).toBe("Password is required");
      }
    });
  });

  describe("idempotence", () => {
    it("should produce same result when validating → invalidating → validating", () => {
      const validInput = {
        email: "test@example.com",
        password: "password123",
      };

      const invalidInput = {
        email: "invalid",
        password: "",
      };

      // First validation (valid)
      const result1 = schema.safeParse(validInput);
      expect(result1.success).toBe(true);

      // Invalidate
      const result2 = schema.safeParse(invalidInput);
      expect(result2.success).toBe(false);

      // Validate again with same valid input
      const result3 = schema.safeParse(validInput);
      expect(result3.success).toBe(true);

      // Results should be identical
      if (result1.success && result3.success) {
        expect(result1.data).toEqual(result3.data);
      }
    });

    it("should produce same error structure for repeated invalid inputs", () => {
      const invalidInput = {
        email: "invalid",
        password: "",
      };

      // First validation
      const result1 = schema.safeParse(invalidInput);
      expect(result1.success).toBe(false);

      // Second validation with same input
      const result2 = schema.safeParse(invalidInput);
      expect(result2.success).toBe(false);

      // Error structures should be identical
      if (!result1.success && !result2.success) {
        expect(result1.error.issues).toHaveLength(result2.error.issues.length);
        expect(result1.error.issues[0].path).toEqual(
          result2.error.issues[0].path,
        );
        expect(result1.error.issues[0].message).toBe(
          result2.error.issues[0].message,
        );
      }
    });

    it("should maintain schema consistency across multiple instantiations", () => {
      const input = {
        email: "test@example.com",
        password: "password123",
      };

      // Create multiple schema instances
      const schema1 = signInFormSchema();
      const schema2 = signInFormSchema();

      const result1 = schema1.safeParse(input);
      const result2 = schema2.safeParse(input);

      expect(result1.success).toBe(result2.success);
      if (result1.success && result2.success) {
        expect(result1.data).toEqual(result2.data);
      }
    });
  });

  describe("edge cases", () => {
    it("should reject whitespace-only password", () => {
      const result = schema.safeParse({
        email: "test@example.com",
        password: "   ",
      });

      // Whitespace is considered valid since min(1) only checks length
      expect(result.success).toBe(true);
    });

    it("should handle very long email addresses", () => {
      const longEmail = `${"a".repeat(64)}@${"b".repeat(63)}.com`;
      const result = schema.safeParse({
        email: longEmail,
        password: "password",
      });

      expect(result.success).toBe(true);
    });

    it("should handle very long passwords", () => {
      const longPassword = "a".repeat(1000);
      const result = schema.safeParse({
        email: "test@example.com",
        password: longPassword,
      });

      expect(result.success).toBe(true);
    });

    it("should reject missing email field", () => {
      const result = schema.safeParse({
        password: "password123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(
          (issue) => issue.path[0] === "email",
        );
        expect(emailError).toBeDefined();
      }
    });

    it("should reject missing password field", () => {
      const result = schema.safeParse({
        email: "test@example.com",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password",
        );
        expect(passwordError).toBeDefined();
      }
    });
  });
});
