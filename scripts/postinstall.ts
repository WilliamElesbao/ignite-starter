import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const memoiristPkgPath = join(
  import.meta.dir,
  "..",
  "node_modules",
  ".bun",
  "memoirist@0.4.0",
  "node_modules",
  "memoirist",
  "package.json",
);

if (!existsSync(memoiristPkgPath)) {
  console.warn("memoirist package.json not found at", memoiristPkgPath);
  process.exit(0);
}

const pkg = JSON.parse(readFileSync(memoiristPkgPath, "utf-8"));

if (pkg.exports?.["."]?.bun) {
  // Remove the 'bun' export condition so Bun uses the CJS entry for require()
  // instead of the ESM-only bun entry, which throws:
  // "TypeError: require() async module ... is unsupported"
  delete pkg.exports["."].bun;
  writeFileSync(memoiristPkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log("Patched memoirist: removed 'bun' export condition");
}
