/**
 * Configuration Validation Tests for SonarCloud
 *
 * **Validates: Requirements 6.3, 6.4, 5.5, 5.6, 6.6**
 *
 * These tests validate the SonarCloud configuration to ensure:
 * - Property 2: Monorepo Package Coverage Completeness
 * - Property 3: SonarCloud Source and Exclusion Consistency
 * - Property 5: Test Coverage Path Existence
 */

import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

interface SonarProperties {
  [key: string]: string;
}

interface DroneStep {
  name: string;
  commands?: string[];
}

interface DroneConfig {
  steps: DroneStep[];
}

/**
 * Parse the sonar-project.properties file
 */
function parseSonarProperties(): SonarProperties {
  const content = readFileSync("sonar-project.properties", "utf-8");
  const properties: SonarProperties = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        properties[key.trim()] = valueParts.join("=").trim();
      }
    }
  }

  return properties;
}

/**
 * Parse the .drone.yml configuration file
 */
function parseDroneConfig(): DroneConfig {
  const droneYaml = readFileSync(".drone.yml", "utf-8");
  return parse(droneYaml) as DroneConfig;
}

/**
 * Get all packages with TypeScript source code
 */
function getTypescriptPackages(): string[] {
  // Based on the monorepo structure, these are all packages with tsconfig.json
  return [
    "apps/web",
    "apps/backend",
    "packages/backend-base",
    "packages/database",
    "packages/emails",
    "packages/api",
    "packages/ui",
  ];
}

describe("SonarCloud Configuration Validation", () => {
  describe("Property 2: Monorepo Package Coverage Completeness", () => {
    /**
     * **Validates: Requirements 2.1, 19.1, 19.2, 19.3**
     *
     * Property: For any package in the monorepo that contains TypeScript
     * source code, that package must be included in at least one of the
     * pipeline's check steps (typecheck, lint, or test).
     */
    it("should include all TypeScript packages in at least one pipeline check step", () => {
      const droneConfig = parseDroneConfig();
      const sonarConfig = parseSonarProperties();
      const typescriptPackages = getTypescriptPackages();

      // Get all check steps
      const typecheckStep = droneConfig.steps.find(
        (s) => s.name === "typecheck",
      );
      const lintStep = droneConfig.steps.find((s) => s.name === "lint");
      const testStep = droneConfig.steps.find((s) => s.name === "test");

      // Combine all commands from check steps
      const allCheckCommands = [
        ...(typecheckStep?.commands || []),
        ...(lintStep?.commands || []),
        ...(testStep?.commands || []),
      ].join("\n");

      // Also check SonarCloud sources
      const sonarSources = sonarConfig["sonar.sources"] || "";

      // Verify each TypeScript package is covered
      for (const pkg of typescriptPackages) {
        const pkgName = pkg.split("/").pop() || pkg;
        const isInPipeline =
          allCheckCommands.includes(pkgName) || allCheckCommands.includes(pkg);
        const isInSonar = sonarSources.includes(pkg);

        expect(
          isInPipeline || isInSonar,
          `Package ${pkg} should be included in at least one check step or SonarCloud sources`,
        ).toBe(true);
      }
    });

    it("should typecheck all TypeScript packages", () => {
      const droneConfig = parseDroneConfig();
      const typecheckStep = droneConfig.steps.find(
        (s) => s.name === "typecheck",
      );
      const commandsStr = typecheckStep?.commands?.join("\n") || "";

      // All packages should be typechecked
      const requiredPackages = [
        "web",
        "backend",
        "backend-base",
        "database",
        "emails",
        "api",
        "ui",
      ];

      for (const pkg of requiredPackages) {
        expect(
          commandsStr.includes(pkg),
          `Package ${pkg} should be included in typecheck step`,
        ).toBe(true);
      }
    });

    it("should analyze all source packages in SonarCloud", () => {
      const sonarConfig = parseSonarProperties();
      const sonarSources = sonarConfig["sonar.sources"] || "";

      // Required source directories per requirements
      const requiredSources = [
        "apps/web/src",
        "apps/backend/src",
        "packages/backend-base/src",
        "packages/database/src",
        "packages/emails/src",
        "packages/ui/src",
      ];

      for (const source of requiredSources) {
        expect(
          sonarSources.includes(source),
          `SonarCloud sources should include ${source}`,
        ).toBe(true);
      }
    });
  });

  describe("Property 3: SonarCloud Source and Exclusion Consistency", () => {
    /**
     * **Validates: Requirements 6.3, 6.4, 5.5**
     *
     * Property: For any path specified in sonar.sources, that path must
     * not also appear in sonar.exclusions to avoid configuration conflicts.
     */
    it("should not have any source path also listed in exclusions", () => {
      const sonarConfig = parseSonarProperties();
      const sources = (sonarConfig["sonar.sources"] || "")
        .split(",")
        .map((s) => s.trim());
      const exclusions = (sonarConfig["sonar.exclusions"] || "")
        .split(",")
        .map((s) => s.trim());

      for (const source of sources) {
        if (!source) continue;

        // Check if this exact source path appears in exclusions
        const isExcluded = exclusions.some((exclusion) => {
          // Exact match
          if (exclusion === source) return true;

          // Check if exclusion pattern would match the source
          // For example, if source is "apps/web/src" and exclusion is "apps/web/**"
          const exclusionPattern = exclusion
            .replace(/\*\*/g, ".*")
            .replace(/\*/g, "[^/]*");
          const regex = new RegExp(`^${exclusionPattern}$`);
          return regex.test(source);
        });

        expect(
          isExcluded,
          `Source path ${source} should not be excluded by sonar.exclusions`,
        ).toBe(false);
      }
    });

    it("should have non-empty sources configuration", () => {
      const sonarConfig = parseSonarProperties();
      const sources = sonarConfig["sonar.sources"];

      expect(sources).toBeDefined();
      expect(sources.length).toBeGreaterThan(0);
    });

    it("should have exclusions for generated code and build artifacts", () => {
      const sonarConfig = parseSonarProperties();
      const exclusions = sonarConfig["sonar.exclusions"] || "";

      const requiredExclusions = [
        "**/node_modules/**",
        "**/generated/**",
        "**/.next/**",
        "**/*.gen.ts",
      ];

      for (const exclusion of requiredExclusions) {
        expect(
          exclusions.includes(exclusion),
          `Exclusions should include ${exclusion}`,
        ).toBe(true);
      }
    });

    it("should exclude test files from source analysis", () => {
      const sonarConfig = parseSonarProperties();
      const exclusions = sonarConfig["sonar.exclusions"] || "";

      const testFilePatterns = [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
      ];

      for (const pattern of testFilePatterns) {
        expect(
          exclusions.includes(pattern),
          `Exclusions should include test file pattern ${pattern}`,
        ).toBe(true);
      }
    });
  });

  describe("Property 5: Test Coverage Path Existence", () => {
    /**
     * **Validates: Requirements 4.3, 5.6, 6.6**
     *
     * Property: For any coverage report path specified in
     * sonar-project.properties (sonar.javascript.lcov.reportPaths),
     * the corresponding test command in the pipeline must include
     * the --coverage flag to ensure the report is generated.
     */
    it("should have coverage flag in test command for packages with LCOV report paths", () => {
      const sonarConfig = parseSonarProperties();
      const droneConfig = parseDroneConfig();

      const lcovPaths = sonarConfig["sonar.javascript.lcov.reportPaths"];

      if (!lcovPaths) {
        // If no LCOV paths are configured, skip this test
        return;
      }

      const reportPaths = lcovPaths.split(",").map((p) => p.trim());
      const testStep = droneConfig.steps.find((s) => s.name === "test");
      const testCommands = testStep?.commands?.join("\n") || "";

      for (const reportPath of reportPaths) {
        if (!reportPath) continue;

        // Extract package name from path (e.g., "apps/web/coverage/lcov.info" -> "apps/web")
        const pathParts = reportPath.split("/");
        const packagePath = pathParts.slice(0, 2).join("/"); // e.g., "apps/web"

        // Check if this package's test command includes --coverage flag
        const hasPackageTest = testCommands.includes(packagePath);

        if (hasPackageTest) {
          // Find the specific command for this package
          const commands = testStep?.commands || [];
          const packageCommand = commands.find((cmd) =>
            cmd.includes(packagePath),
          );

          expect(
            packageCommand?.includes("--coverage"),
            `Test command for ${packagePath} should include --coverage flag to generate ${reportPath}`,
          ).toBe(true);
        }
      }
    });

    it("should have LCOV report path configured for apps/web", () => {
      const sonarConfig = parseSonarProperties();
      const lcovPaths = sonarConfig["sonar.javascript.lcov.reportPaths"];

      expect(lcovPaths).toBeDefined();
      expect(lcovPaths).toContain("apps/web/coverage/lcov.info");
    });

    it("should have --coverage flag in web test command", () => {
      const droneConfig = parseDroneConfig();
      const testStep = droneConfig.steps.find((s) => s.name === "test");
      // Find the web test command
      const commands = testStep?.commands || [];
      const webTestCommand = commands.find((cmd) => cmd.includes("apps/web"));

      expect(webTestCommand).toBeDefined();
      expect(
        webTestCommand?.includes("--coverage"),
        "Web test command should include --coverage flag",
      ).toBe(true);
    });

    it("should have test.inclusions configured for test files", () => {
      const sonarConfig = parseSonarProperties();
      const testInclusions = sonarConfig["sonar.test.inclusions"];

      expect(testInclusions).toBeDefined();

      const testPatterns = [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
      ];

      for (const pattern of testPatterns) {
        expect(
          testInclusions.includes(pattern),
          `Test inclusions should include ${pattern}`,
        ).toBe(true);
      }
    });
  });

  describe("Additional SonarCloud Configuration Validation", () => {
    it("should have correct project key", () => {
      const sonarConfig = parseSonarProperties();
      expect(sonarConfig["sonar.projectKey"]).toBe(
        "ignite-starter_ignite-starter",
      );
    });

    it("should have correct organization", () => {
      const sonarConfig = parseSonarProperties();
      expect(sonarConfig["sonar.organization"]).toBe("ignite-starter");
    });

    it("should have tests configuration", () => {
      const sonarConfig = parseSonarProperties();
      const tests = sonarConfig["sonar.tests"];

      expect(tests).toBeDefined();
      expect(tests).toContain("apps/web/src");
    });
  });
});
