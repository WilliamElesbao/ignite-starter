#!/usr/bin/env bun

/**
 * Unused i18n Keys Detection Script
 *
 * Scans the codebase to find translation keys that are defined in locale files
 * but never used in the source code. Helps identify dead translations that can
 * be safely removed.
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ============================================================================
// Type Definitions
// ============================================================================

type KeyPath = string;

interface UnusedKeyResult {
  unusedKeys: KeyPath[];
  totalKeys: number;
  usedKeys: number;
}

// ============================================================================
// Key Extractor (reused from validate-i18n.ts)
// ============================================================================

/**
 * Recursively extracts all key paths from a nested JSON object
 */
function extractKeys(obj: Record<string, unknown>, prefix = ""): KeyPath[] {
  const keys: KeyPath[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Recursively traverse nested objects
      keys.push(...extractKeys(value as Record<string, unknown>, currentPath));
    } else {
      // Leaf value - this is a translation key
      keys.push(currentPath);
    }
  }

  return keys.sort();
}

// ============================================================================
// Source Code Scanner
// ============================================================================

/**
 * Recursively scans a directory for source files
 */
function scanSourceFiles(
  dir: string,
  extensions: string[] = [".ts", ".tsx"],
): string[] {
  const files: string[] = [];

  function scan(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      // Skip node_modules, .next, and other build directories
      if (
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules" &&
        entry.name !== "dist" &&
        entry.name !== "build"
      ) {
        scan(fullPath);
      } else if (
        entry.isFile() &&
        extensions.some((ext) => entry.name.endsWith(ext))
      ) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

/**
 * Finds namespace bindings for useTranslations/getTranslations calls
 */
interface TranslationBinding {
  variableName: string;
  namespace: string;
}

function getNamespaceBindings(content: string): TranslationBinding[] {
  const bindings: TranslationBinding[] = [];
  const bindingRegex =
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g;

  for (const match of content.matchAll(bindingRegex)) {
    const variableName = match[1];
    const namespace = match[2] ?? "";
    bindings.push({ variableName, namespace });
  }

  return bindings;
}

/**
 * Checks if a translation key is used in the source code
 */
function isKeyUsedInCode(key: KeyPath, sourceFiles: string[]): boolean {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const directKeyPattern = new RegExp(`['"\`]${escapedKey}['"\`]`, "g");

  const keyParts = key.split(".");

  for (const filePath of sourceFiles) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");

      if (directKeyPattern.test(content)) {
        return true;
      }

      const bindings = getNamespaceBindings(content);
      for (const binding of bindings) {
        const namespaceParts: string[] = binding.namespace
          ? binding.namespace.split(".")
          : [];

        if (namespaceParts.length > keyParts.length) {
          continue;
        }

        const matchesPrefix = namespaceParts.every(
          (part: string, index: number) => keyParts[index] === part,
        );

        if (!matchesPrefix) {
          continue;
        }

        const suffix = keyParts.slice(namespaceParts.length).join(".");
        const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const callPattern = new RegExp(
          `\\b${binding.variableName}(?:\\.(?:rich|raw|markup))?\\s*\\(\\s*['"\`]${escapedSuffix}['"\`]`,
          "g",
        );

        if (callPattern.test(content)) {
          return true;
        }
      }
    } catch {}
  }

  return false;
}

// ============================================================================
// Main Logic
// ============================================================================

/**
 * Finds unused translation keys in the codebase
 */
function findUnusedKeys(
  localeFilePath: string,
  sourceDir: string,
): UnusedKeyResult {
  // Load and parse the locale file
  const localeContent = fs.readFileSync(localeFilePath, "utf-8");
  const localeData = JSON.parse(localeContent) as Record<string, unknown>;

  // Extract all translation keys
  const allKeys = extractKeys(localeData);

  // Scan source files
  console.log("Scanning source files...");
  const sourceFiles = scanSourceFiles(sourceDir);
  console.log(`Found ${sourceFiles.length} source files\n`);

  // Check each key for usage
  const unusedKeys: KeyPath[] = [];
  let checkedCount = 0;

  for (const key of allKeys) {
    checkedCount++;
    if (checkedCount % 10 === 0) {
      process.stdout.write(
        `\rChecking keys: ${checkedCount}/${allKeys.length}`,
      );
    }

    if (!isKeyUsedInCode(key, sourceFiles)) {
      unusedKeys.push(key);
    }
  }

  process.stdout.write(
    `\rChecking keys: ${allKeys.length}/${allKeys.length}\n\n`,
  );

  return {
    unusedKeys,
    totalKeys: allKeys.length,
    usedKeys: allKeys.length - unusedKeys.length,
  };
}

/**
 * Reports unused keys to the console
 */
function reportUnusedKeys(result: UnusedKeyResult): void {
  if (result.unusedKeys.length === 0) {
    console.log("✓ All translation keys are being used!");
    console.log(
      `\nTotal keys: ${result.totalKeys}, Used: ${result.usedKeys}\n`,
    );
    return;
  }

  console.error("⚠ Found unused translation keys:\n");

  // Group keys by namespace (first part of the key)
  const keysByNamespace = new Map<string, KeyPath[]>();

  for (const key of result.unusedKeys) {
    const namespace = key.split(".")[0];
    const keys = keysByNamespace.get(namespace) || [];
    keys.push(key);
    keysByNamespace.set(namespace, keys);
  }

  // Display grouped by namespace
  for (const [namespace, keys] of keysByNamespace) {
    console.error(`  ${namespace}:`);
    for (const key of keys) {
      console.error(`    - ${key}`);
    }
    console.error("");
  }

  console.error(`Total unused keys: ${result.unusedKeys.length}`);
  console.error(`Total keys: ${result.totalKeys}`);
  console.error(`Used keys: ${result.usedKeys}`);
  console.error(
    `Usage rate: ${((result.usedKeys / result.totalKeys) * 100).toFixed(1)}%\n`,
  );
}

/**
 * Main entry point
 */
async function main() {
  try {
    const localeFilePath = path.join(
      process.cwd(),
      "src/lib/i18n/locales/en.json",
    );
    const sourceDir = path.join(process.cwd(), "src");

    // Validate paths
    if (!fs.existsSync(localeFilePath)) {
      throw new Error(
        `Locale file not found: ${localeFilePath}\n` +
          `Please ensure the file exists.`,
      );
    }

    if (!fs.existsSync(sourceDir)) {
      throw new Error(
        `Source directory not found: ${sourceDir}\n` +
          `Please ensure the directory exists.`,
      );
    }

    console.log("🔍 Checking for unused translation keys...\n");
    console.log(`Locale file: ${localeFilePath}`);
    console.log(`Source directory: ${sourceDir}\n`);

    const result = findUnusedKeys(localeFilePath, sourceDir);
    reportUnusedKeys(result);

    // Exit with code 1 if there are unused keys (for CI/CD)
    process.exit(result.unusedKeys.length > 0 ? 1 : 0);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

// Run main function if executed directly
if (import.meta.main) {
  main();
}
