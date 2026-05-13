#!/usr/bin/env bun

/**
 * i18n Translation Validation Script
 *
 * Validates that all locale files maintain identical key structures
 * to prevent runtime errors caused by missing or extraneous translation keys.
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Represents a loaded locale file with its metadata and parsed content
 */
export interface LocaleFile {
  /** File system path to the locale file */
  path: string;
  /** File name (e.g., "en.json", "pt-BR.json") */
  name: string;
  /** Parsed JSON content of the locale file */
  content: Record<string, unknown>;
}

/**
 * Result of scanning the locale directory
 */
export interface ScanResult {
  /** The source locale file (e.g., en.json) used as reference */
  source: LocaleFile;
  /** All target locale files to validate against the source */
  targets: LocaleFile[];
}

/**
 * A single validation issue found during comparison
 */
export interface ValidationIssue {
  /** Dot-notation path to the translation key (e.g., "dashboard.toast.welcome.title") */
  keyPath: KeyPath;
  /** Name of the locale file where the issue was found */
  localeName: string;
  /** Type of issue: missing (in source but not target) or extraneous (in target but not source) */
  type: "missing" | "extraneous";
}

/**
 * Complete validation result with all issues and validity status
 */
export interface ValidationResult {
  /** List of all validation issues found */
  issues: ValidationIssue[];
  /** Whether validation passed (true if no issues found) */
  isValid: boolean;
}

/**
 * Dot-notation path to a translation key
 * @example "dashboard.toast.welcome.title"
 * @example "common.name"
 */
export type KeyPath = string;

/**
 * Nested translation object structure
 */
export type TranslationObject = Record<string, unknown>;

// ============================================================================
// File System Scanner
// ============================================================================

import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Scans the locale directory and loads all locale files
 *
 * @param localeDir - Path to the directory containing locale JSON files
 * @param sourceFileName - Name of the source locale file (e.g., "en.json")
 * @returns ScanResult containing the source file and all target files
 * @throws Error if directory doesn't exist, source file is missing, or JSON parsing fails
 *
 * **Validates: Requirements 1.1, 1.2, 7.1, 7.2, 7.3, 8.1**
 */
export function scanLocaleDirectory(
  localeDir: string,
  sourceFileName: string,
): ScanResult {
  // Validate that the locale directory exists
  if (!fs.existsSync(localeDir)) {
    throw new Error(
      `Locale directory not found: ${localeDir}\n` +
        `Please ensure the directory exists and the path is correct.`,
    );
  }

  // Construct the full path to the source file
  const sourceFilePath = path.join(localeDir, sourceFileName);

  // Validate that the source file exists
  if (!fs.existsSync(sourceFilePath)) {
    throw new Error(
      `Source locale file not found: ${sourceFilePath}\n` +
        `The source locale (${sourceFileName}) is required for validation.`,
    );
  }

  // Read all files from the directory
  let files: string[];
  try {
    files = fs.readdirSync(localeDir);
  } catch (error) {
    throw new Error(
      `Failed to read directory: ${localeDir}\n` +
        `Reason: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Filter for .json files only
  const jsonFiles = files.filter((file) => path.extname(file) === ".json");

  // Load and parse the source file
  const source = loadLocaleFile(sourceFilePath, sourceFileName);

  // Load and parse all target files (excluding the source)
  const targets: LocaleFile[] = [];
  for (const fileName of jsonFiles) {
    // Skip the source file
    if (fileName === sourceFileName) {
      continue;
    }

    const filePath = path.join(localeDir, fileName);
    const localeFile = loadLocaleFile(filePath, fileName);
    targets.push(localeFile);
  }

  return {
    source,
    targets,
  };
}

/**
 * Loads and parses a single locale file
 *
 * @param filePath - Full path to the locale file
 * @param fileName - Name of the file (for error messages)
 * @returns LocaleFile with parsed content
 * @throws Error if file cannot be read or parsed
 */
function loadLocaleFile(filePath: string, fileName: string): LocaleFile {
  // Read the file content
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to read file: ${filePath}\n` +
        `Reason: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Parse the JSON content
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Invalid JSON in file: ${fileName}\n` +
        `Parse error: ${error instanceof Error ? error.message : String(error)}\n` +
        `Please ensure the file contains valid JSON.`,
    );
  }

  return {
    path: filePath,
    name: fileName,
    content: parsed,
  };
}

// ============================================================================
// Key Extractor
// ============================================================================

/**
 * Extracts all translation keys from a nested JSON object into a flat sorted array
 *
 * Recursively traverses the object structure and constructs dot-notation paths
 * for all leaf values (strings). Intermediate objects are treated as structural
 * nodes and do not appear in the output.
 *
 * @param obj - The nested translation object to extract keys from
 * @returns Sorted array of dot-notation key paths
 *
 * @example
 * ```typescript
 * const translations = {
 *   common: {
 *     name: "Name",
 *     email: "Email"
 *   },
 *   "sign-in": {
 *     welcome: "Welcome"
 *   }
 * };
 *
 * extractKeys(translations);
 * // Returns: ["common.email", "common.name", "sign-in.welcome"]
 * ```
 *
 * **Validates: Requirements 1.3, 3.1, 3.2, 3.4**
 */
export function extractKeys(obj: Record<string, unknown>): KeyPath[] {
  const keys: KeyPath[] = [];

  /**
   * Recursive helper function to traverse the object tree
   *
   * @param current - Current object being traversed
   * @param prefix - Accumulated dot-notation path prefix
   */
  function traverse(current: unknown, prefix: string): void {
    // Handle null or undefined
    if (current == null) {
      // Treat null/undefined as leaf values
      if (prefix) {
        keys.push(prefix);
      }
      return;
    }

    // Handle non-object types (strings, numbers, booleans, etc.)
    if (typeof current !== "object") {
      // This is a leaf value - add the key path
      if (prefix) {
        keys.push(prefix);
      }
      return;
    }

    // Handle arrays - treat as leaf values
    if (Array.isArray(current)) {
      if (prefix) {
        keys.push(prefix);
      }
      return;
    }

    // Handle objects - recurse into nested structure
    const obj = current as Record<string, unknown>;
    const entries = Object.entries(obj);

    // Empty objects are treated as leaf values
    if (entries.length === 0) {
      if (prefix) {
        keys.push(prefix);
      }
      return;
    }

    // Recursively process each property
    for (const [key, value] of entries) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      traverse(value, newPrefix);
    }
  }

  // Start traversal from the root
  traverse(obj, "");

  // Sort keys alphabetically for consistent comparison
  return keys.sort();
}

// ============================================================================
// Validator
// ============================================================================

/**
 * Validates target locales against the source locale keys
 *
 * Compares the source locale key set with each target locale key set to identify:
 * - Missing keys: keys present in source but absent in target
 * - Extraneous keys: keys present in target but absent in source
 *
 * Uses Set operations for O(1) membership checks, ensuring efficient validation
 * even with large translation files.
 *
 * @param sourceKeys - Array of key paths from the source locale (e.g., en.json)
 * @param targetLocales - Array of target locales with their names and key paths
 * @returns ValidationResult containing all issues and validity status
 *
 * @example
 * ```typescript
 * const sourceKeys = ["common.name", "common.email", "dashboard.title"];
 * const targetLocales = [
 *   {
 *     name: "pt-BR.json",
 *     keys: ["common.name", "dashboard.title", "extra.key"]
 *   }
 * ];
 *
 * const result = validateLocales(sourceKeys, targetLocales);
 * // result.issues will contain:
 * // - { keyPath: "common.email", localeName: "pt-BR.json", type: "missing" }
 * // - { keyPath: "extra.key", localeName: "pt-BR.json", type: "extraneous" }
 * // result.isValid will be false
 * ```
 *
 * **Validates: Requirements 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 3.3**
 */
export function validateLocales(
  sourceKeys: KeyPath[],
  targetLocales: Array<{ name: string; keys: KeyPath[] }>,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Convert source keys to a Set for O(1) membership checks
  const sourceSet = new Set(sourceKeys);

  // Validate each target locale
  for (const target of targetLocales) {
    // Convert target keys to a Set for O(1) membership checks
    const targetSet = new Set(target.keys);

    // Find missing keys: keys in source but not in target
    for (const key of sourceKeys) {
      if (!targetSet.has(key)) {
        issues.push({
          keyPath: key,
          localeName: target.name,
          type: "missing",
        });
      }
    }

    // Find extraneous keys: keys in target but not in source
    for (const key of target.keys) {
      if (!sourceSet.has(key)) {
        issues.push({
          keyPath: key,
          localeName: target.name,
          type: "extraneous",
        });
      }
    }
  }

  return {
    issues,
    isValid: issues.length === 0,
  };
}

// ============================================================================
// Reporter
// ============================================================================

/**
 * Reports validation results to the console with formatted output
 *
 * Displays validation results with clear visual indicators and grouped output.
 * Success cases show a simple checkmark message. Failure cases group issues
 * by type (missing/extraneous) and locale name for easy identification.
 *
 * @param result - The validation result containing issues and validity status
 *
 * @example
 * ```typescript
 * // Success case:
 * reportResults({ issues: [], isValid: true });
 * // Output: ✓ All locale files are valid
 *
 * // Failure case:
 * reportResults({
 *   issues: [
 *     { keyPath: "common.email", localeName: "pt-BR.json", type: "missing" },
 *     { keyPath: "extra.key", localeName: "pt-BR.json", type: "extraneous" }
 *   ],
 *   isValid: false
 * });
 * // Output:
 * // ✗ Translation validation failed
 * //
 * // Missing Keys:
 * //   pt-BR.json:
 * //     - common.email
 * //
 * // Extraneous Keys:
 * //   pt-BR.json:
 * //     - extra.key
 * //
 * // Total issues: 2
 * ```
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 */
export function reportResults(result: ValidationResult): void {
  // Success case: no issues found
  if (result.isValid) {
    console.log("✓ All locale files are valid");
    return;
  }

  // Failure case: group and display issues
  console.error("✗ Translation validation failed\n");

  // Group issues by type and locale
  const missingByLocale = new Map<string, KeyPath[]>();
  const extraneousByLocale = new Map<string, KeyPath[]>();

  for (const issue of result.issues) {
    if (issue.type === "missing") {
      const keys = missingByLocale.get(issue.localeName) || [];
      keys.push(issue.keyPath);
      missingByLocale.set(issue.localeName, keys);
    } else {
      const keys = extraneousByLocale.get(issue.localeName) || [];
      keys.push(issue.keyPath);
      extraneousByLocale.set(issue.localeName, keys);
    }
  }

  // Display missing keys section
  if (missingByLocale.size > 0) {
    console.error("Missing Keys:");
    for (const [localeName, keys] of missingByLocale) {
      console.error(`  ${localeName}:`);
      for (const key of keys) {
        console.error(`    - ${key}`);
      }
    }
    console.error("");
  }

  // Display extraneous keys section
  if (extraneousByLocale.size > 0) {
    console.error("Extraneous Keys:");
    for (const [localeName, keys] of extraneousByLocale) {
      console.error(`  ${localeName}:`);
      for (const key of keys) {
        console.error(`    - ${key}`);
      }
    }
    console.error("");
  }

  // Display total issue count
  console.error(`Total issues: ${result.issues.length}`);
}

// ============================================================================
// Exit Code Handler
// ============================================================================

/**
 * Determines the appropriate exit code based on validation results
 *
 * Returns exit code 0 for successful validation (no issues found) or exit code 1
 * for failed validation (issues found). This enables CI/CD integration by providing
 * a standard mechanism for build pipelines to detect validation failures.
 *
 * @param result - The validation result containing issues and validity status
 * @returns Exit code 0 if validation passed, 1 if validation failed
 *
 * @example
 * ```typescript
 * // Success case:
 * const result = { issues: [], isValid: true };
 * getExitCode(result); // Returns 0
 *
 * // Failure case:
 * const result = {
 *   issues: [{ keyPath: "common.email", localeName: "pt-BR.json", type: "missing" }],
 *   isValid: false
 * };
 * getExitCode(result); // Returns 1
 * ```
 *
 * **Validates: Requirements 5.1, 5.2**
 */
export function getExitCode(result: ValidationResult): number {
  return result.isValid ? 0 : 1;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

/**
 * Main entry point for the i18n validation script
 *
 * Orchestrates the complete validation pipeline:
 * 1. Defines locale directory path and source file name
 * 2. Scans and loads all locale files
 * 3. Extracts keys from source and target locales
 * 4. Validates target locales against source
 * 5. Reports results to console
 * 6. Exits with appropriate exit code
 *
 * All errors are caught and handled at the top level, ensuring the script
 * always exits cleanly with a descriptive error message and exit code 1.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 5.1, 5.2**
 */
async function main(): Promise<void> {
  try {
    // Define locale directory path relative to the script location
    const localeDir = path.join(process.cwd(), "src/lib/i18n/locales");
    
    // Define source file name (English as the reference locale)
    const sourceFileName = "en.json";

    // Step 1: Scan and load all locale files
    const { source, targets } = scanLocaleDirectory(localeDir, sourceFileName);

    // Step 2: Extract keys from the source locale
    const sourceKeys = extractKeys(source.content);

    // Step 3: Extract keys from all target locales
    const targetLocales = targets.map((target) => ({
      name: target.name,
      keys: extractKeys(target.content),
    }));

    // Step 4: Validate target locales against source
    const result = validateLocales(sourceKeys, targetLocales);

    // Step 5: Report results to console
    reportResults(result);

    // Step 6: Exit with appropriate exit code
    process.exit(getExitCode(result));
  } catch (error) {
    // Top-level error handling for any unexpected errors
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`Error: ${errorMessage}`);
    process.exit(1);
  }
}

// Execute main function if this script is run directly
if (import.meta.main) {
  main();
}
