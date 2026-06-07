import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 10000, // 10 seconds for async tests
    server: {
      deps: {
        external: ["bun"], // Externalize Bun to avoid import errors
        inline: ["@repo/db"], // Inline database package to apply mocks
      },
    },
    alias: {
      // Mock Bun's randomUUIDv7 for Vitest
      bun: new URL("./src/test/mocks/bun.mock.ts", import.meta.url).pathname,
    },
    env: {
      // Set required environment variables for tests
      VITEST: "true",
      NODE_ENV: "test",
      RESEND_API_KEY: "re_test_mock_api_key",
      EMAIL_FROM: "test@example.com",
      EMAIL_TO: "recipient@example.com",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      REDIS_URL: "redis://localhost:6379",
      WEB_URL: "http://localhost:3000",
      GOOGLE_CLIENT_ID: "test-google-client-id",
      GOOGLE_CLIENT_SECRET: "test-google-client-secret",
      STRIPE_API_KEY: "sk_test_mock",
      STRIPE_WEBHOOK_SECRET: "whsec_test_mock",
    },
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: [
        "src/plugins/email/email.service.ts",
        "src/plugins/queue/email-queue.service.ts",
        "src/plugins/queue/email-queue.worker.ts",
      ],
      exclude: ["node_modules/", "src/test/", "**/*.test.ts"],
    },
  },
});

// Ensure environment variables are set in Bun.env for tests
if (typeof Bun !== "undefined" && Bun.env) {
  Object.assign(Bun.env, {
    RESEND_API_KEY: "re_test_mock_api_key",
    EMAIL_FROM: "test@example.com",
    EMAIL_TO: "recipient@example.com",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    WEB_URL: "http://localhost:3000",
    GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
    STRIPE_API_KEY: "sk_test_mock",
    STRIPE_WEBHOOK_SECRET: "whsec_test_mock",
  });
}
