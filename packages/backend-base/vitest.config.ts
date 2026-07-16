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
