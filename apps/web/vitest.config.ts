import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    pool: "forks", // Required for Bun compatibility with jsdom
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
        "src/features/auth/hooks/sign-in.ts",
        "src/features/auth/sign-in/hooks/form-schema.ts",
        "src/features/auth/sign-in/hooks/use-sign-in-form.ts",
        "src/utils/safe-promise.ts",
      ],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.test.ts",
        "**/*.test.tsx",
        ".next/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@repo/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
    },
  },
});
