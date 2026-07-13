#!/usr/bin/env bun

/**
 * Unused i18n key detection using TypeScript AST (ts-morph).
 *
 * Handles patterns that regex cannot:
 *   t(feature)                           → resolves "key-a" | "key-b" via type system
 *   t(`settings.${interval}`)            → resolves interpolated union types (e.g., "day" | "month")
 *   t(`prefix.${dynamicValue}`)          → falls back to marking "prefix.*" if unresolvable
 *   useTranslations(x ? "ns-a" : "ns-b") → extracts both namespaces from ternary
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { SourceFile, Type } from "ts-morph";
import { Node, Project, SyntaxKind } from "ts-morph";

// ─── Types ────────────────────────────────────────────────────────────────────

type KeyPath = string;

// ─── JSON key extraction ──────────────────────────────────────────────────────

function extractJsonKeys(obj: Record<string, unknown>, prefix = ""): KeyPath[] {
  const keys: KeyPath[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const current = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...extractJsonKeys(value as Record<string, unknown>, current));
    } else {
      keys.push(current);
    }
  }
  return keys;
}

// ─── Type-system resolution ───────────────────────────────────────────────────

/**
 * Extracts all string literal values from a TypeScript type.
 * Handles string literal types and unions of string literals.
 *
 * This is the key advantage over regex — TypeScript already knows that
 * `feature: Feature` resolves to `"key-a" | "key-b" | ...`
 */
function extractStringLiteralsFromType(type: Type): string[] {
  if (type.isStringLiteral()) {
    const value = type.getLiteralValue();
    return typeof value === "string" ? [value] : [];
  }
  if (type.isUnion()) {
    return type.getUnionTypes().flatMap(extractStringLiteralsFromType);
  }
  return [];
}

// ─── Namespace resolution ─────────────────────────────────────────────────────

/**
 * Extracts all possible namespace strings from a useTranslations argument.
 *
 * Handles:
 *   "namespace"               → ["namespace"]
 *   x ? "ns-a" : "ns-b"      → ["ns-a", "ns-b"]
 *   variable (typed)          → resolved via type system
 *   no argument               → [""]  (root namespace)
 */
function extractNamespacesFromNode(node: Node | undefined): string[] {
  if (!node) return [""];

  if (Node.isStringLiteral(node)) {
    return [node.getLiteralValue()];
  }

  if (Node.isConditionalExpression(node)) {
    return [
      ...extractNamespacesFromNode(node.getWhenTrue()),
      ...extractNamespacesFromNode(node.getWhenFalse()),
    ];
  }

  const literals = extractStringLiteralsFromType(node.getType());
  return literals.length > 0 ? literals : [""];
}

// ─── Per-file analysis ────────────────────────────────────────────────────────

const TRANSLATION_FUNCTIONS = new Set(["useTranslations", "getTranslations"]);
const TRANSLATION_METHODS = new Set(["rich", "raw", "markup"]);
const SKIP_PATHS = [
  "/node_modules/",
  "/.next/",
  "/dist/",
  "/build/",
  "/scripts/",
];

function analyzeFile(
  sourceFile: SourceFile,
  usedKeys: Set<string>,
  templatePrefixes: Set<string>,
): void {
  const filePath = sourceFile.getFilePath();

  // Skip auto-generated declarations and build artifacts
  if (filePath.endsWith(".d.ts")) return;
  if (SKIP_PATHS.some((segment) => filePath.includes(segment))) return;

  // ── Step 1: Collect translation function bindings ──────────────────────────
  // Map of variable name → possible namespaces.
  // We union namespaces for the same variable name to handle the case where
  // multiple functions in the same file reuse the identifier "t" with different
  // namespaces (e.g., useTranslations() vs useTranslations("features.free")).
  const bindings = new Map<string, string[]>();

  // Helper function to process Promise.all() patterns
  function processPromiseAll(
    _declaration: Node,
    arrayArg: Node,
    bindingPattern: Node,
  ): void {
    if (!Node.isArrayLiteralExpression(arrayArg)) return;
    if (!Node.isArrayBindingPattern(bindingPattern)) return;

    const elements = arrayArg.getElements();
    const bindingElements = bindingPattern.getElements();

    if (bindingElements.length !== elements.length) return;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const bindingElement = bindingElements[i];

      if (!bindingElement || Node.isOmittedExpression(bindingElement)) continue;

      let elemInit = element;
      if (Node.isAwaitExpression(elemInit)) elemInit = elemInit.getExpression();
      if (!Node.isCallExpression(elemInit)) continue;

      const elemCallee = elemInit.getExpression();
      if (!Node.isIdentifier(elemCallee)) continue;
      if (!TRANSLATION_FUNCTIONS.has(elemCallee.getText())) continue;

      const bindingName = bindingElement.getText();
      const args = elemInit.getArguments();
      const namespaces =
        args.length > 0 ? extractNamespacesFromNode(args[0]) : [""];

      const existing = bindings.get(bindingName) ?? [];
      bindings.set(bindingName, [...new Set([...existing, ...namespaces])]);
    }
  }

  for (const decl of sourceFile.getDescendantsOfKind(
    SyntaxKind.VariableDeclaration,
  )) {
    let init = decl.getInitializer();
    if (!init) continue;

    const bindingPattern = decl.getNameNode();

    // Unwrap: const t = await getTranslations(...)
    if (Node.isAwaitExpression(init)) init = init.getExpression();

    // Handle: const [t, data] = await Promise.all([getTranslations(), ...])
    if (Node.isCallExpression(init)) {
      const expr = init.getExpression();
      if (Node.isPropertyAccessExpression(expr)) {
        const obj = expr.getExpression();
        const prop = expr.getName();
        if (
          Node.isIdentifier(obj) &&
          obj.getText() === "Promise" &&
          prop === "all"
        ) {
          const promiseAllArg = init.getArguments()[0];
          processPromiseAll(decl, promiseAllArg ?? init, bindingPattern);
          continue;
        }
      }
    }

    if (!Node.isCallExpression(init)) continue;

    const callee = init.getExpression();
    if (!Node.isIdentifier(callee)) continue;
    if (!TRANSLATION_FUNCTIONS.has(callee.getText())) continue;

    const args = init.getArguments();
    const namespaces =
      args.length > 0 ? extractNamespacesFromNode(args[0]) : [""];

    const existing = bindings.get(decl.getName()) ?? [];
    bindings.set(decl.getName(), [...new Set([...existing, ...namespaces])]);
  }

  if (bindings.size === 0) return;

  // ── Step 2: Resolve every translation call ─────────────────────────────────
  for (const call of sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression,
  )) {
    const callee = call.getExpression();
    let varName: string | null = null;

    if (Node.isIdentifier(callee) && bindings.has(callee.getText())) {
      varName = callee.getText();
    } else if (Node.isPropertyAccessExpression(callee)) {
      const obj = callee.getExpression();
      if (
        Node.isIdentifier(obj) &&
        bindings.has(obj.getText()) &&
        TRANSLATION_METHODS.has(callee.getName())
      ) {
        varName = obj.getText();
      }
    }

    if (!varName) continue;

    const namespaces = bindings.get(varName) ?? [""];
    const args = call.getArguments();
    if (args.length === 0) continue;

    const keyArg = args[0];

    function addKey(suffix: string) {
      for (const ns of namespaces) {
        usedKeys.add(ns ? `${ns}.${suffix}` : suffix);
      }
    }

    if (Node.isStringLiteral(keyArg)) {
      // t("some.key")
      addKey(keyArg.getLiteralValue());
    } else if (Node.isNoSubstitutionTemplateLiteral(keyArg)) {
      // t(`key`) — template literal without interpolation
      addKey(keyArg.getLiteralValue());
    } else if (Node.isTemplateExpression(keyArg)) {
      // t(`settings.${interval}`) — try to resolve interpolated values first
      const prefix = keyArg.getHead().getLiteralText();
      if (!prefix) continue;

      // Try to resolve interpolated expressions via type system
      const spans = keyArg.getTemplateSpans();
      let resolvedValues: string[] | null = null;

      // If there's exactly one interpolation, try to extract its possible values
      if (spans.length === 1) {
        const expr = spans[0].getExpression();
        const literals = extractStringLiteralsFromType(expr.getType());
        if (literals.length > 0) {
          resolvedValues = literals;
        }
      }

      if (resolvedValues) {
        // Type system resolved the values — mark specific keys
        for (const value of resolvedValues) {
          for (const ns of namespaces) {
            usedKeys.add(ns ? `${ns}.${prefix}${value}` : `${prefix}${value}`);
          }
        }
      } else {
        // Fallback: mark entire prefix subtree as used
        for (const ns of namespaces) {
          templatePrefixes.add(ns ? `${ns}.${prefix}` : prefix);
        }
      }
    } else {
      // t(variable) — ask TypeScript what values this variable can be
      // e.g. feature: "key-a" | "key-b" → marks both as used
      const literals = extractStringLiteralsFromType(keyArg.getType());
      for (const val of literals) {
        addKey(val);
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const localeFilePath = path.join(
    process.cwd(),
    "src/lib/i18n/locales/en.json",
  );
  const tsConfigFilePath = path.join(process.cwd(), "tsconfig.json");

  if (!fs.existsSync(localeFilePath))
    throw new Error(`Locale file not found: ${localeFilePath}`);
  if (!fs.existsSync(tsConfigFilePath))
    throw new Error(`tsconfig.json not found: ${tsConfigFilePath}`);

  console.log("🔍 Unused i18n key detection (AST-based)\n");

  const allKeys = new Set(
    extractJsonKeys(
      JSON.parse(fs.readFileSync(localeFilePath, "utf-8")) as Record<
        string,
        unknown
      >,
    ),
  );
  console.log(`Keys in en.json: ${allKeys.size}`);

  // ts-morph loads the full TypeScript compiler — slower than regex but type-aware
  console.log("Loading TypeScript project...");
  const project = new Project({ tsConfigFilePath });

  const sourceFiles = project.getSourceFiles();
  console.log(`Source files: ${sourceFiles.length}\n`);

  const usedKeys = new Set<string>();
  const templatePrefixes = new Set<string>();

  let analyzed = 0;
  for (const sourceFile of sourceFiles) {
    analyzeFile(sourceFile, usedKeys, templatePrefixes);
    if (++analyzed % 20 === 0 || analyzed === sourceFiles.length) {
      process.stdout.write(`\rAnalyzing: ${analyzed}/${sourceFiles.length}`);
    }
  }
  process.stdout.write("\n\n");

  if (templatePrefixes.size > 0) {
    console.log(`Template prefixes (entire subtree marked as used):`);
    for (const p of templatePrefixes) console.log(`  ${p}*`);
    console.log("");
  }

  const unusedKeys = [...allKeys]
    .filter((key) => {
      if (usedKeys.has(key)) return false;
      if ([...templatePrefixes].some((p) => key.startsWith(p))) return false;
      return true;
    })
    .sort();

  if (unusedKeys.length === 0) {
    console.log("✓ All translation keys are being used!\n");
    console.log(`Total: ${allKeys.size} keys, all in use.`);
    process.exit(0);
  }

  console.error(`⚠ Found ${unusedKeys.length} unused key(s):\n`);

  const byNs = new Map<string, string[]>();
  for (const key of unusedKeys) {
    const ns = key.split(".")[0];
    byNs.set(ns, [...(byNs.get(ns) ?? []), key]);
  }

  for (const [ns, keys] of byNs) {
    console.error(`  ${ns}:`);
    for (const key of keys) console.error(`    - ${key}`);
    console.error("");
  }

  const usedCount = allKeys.size - unusedKeys.length;
  console.error(`Total unused: ${unusedKeys.length} / ${allKeys.size}`);
  console.error(
    `Usage rate: ${((usedCount / allKeys.size) * 100).toFixed(1)}%`,
  );

  process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
