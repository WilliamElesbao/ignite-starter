import path from "node:path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname = typeof __dirname !== "undefined" ? __dirname : process.cwd();

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: ["src/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
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
        "src/Button/Button.tsx",
        "src/Button/ButtonTailwind.tsx",
        "src/Button/ButtonCssModule.tsx",
      ],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.css",
        "**/*.module.css",
        ".next/**",
        "src/stories/**",
        ".storybook/**",
      ],
    },
  },
});
