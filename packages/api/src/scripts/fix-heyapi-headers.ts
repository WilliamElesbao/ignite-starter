import { promises as fs } from "node:fs";
import path from "node:path";

const GENERATED_DIR = "./generated/api/client";
const TARGET_FILES = ["utils.gen.ts", "utils.ts"];
const SOURCE = "headers.forEach((value, key) => {";
const TARGET = "headers.forEach((value: string, key: string) => {";

async function patchFile(filePath: string): Promise<boolean> {
  let content: string;

  try {
    content = await fs.readFile(filePath, "utf-8");
  } catch {
    return false;
  }

  if (!content.includes(SOURCE)) {
    return false;
  }

  const updated = content.replaceAll(SOURCE, TARGET);
  await fs.writeFile(filePath, updated);

  return true;
}

async function main() {
  let patchedAnyFile = false;

  for (const fileName of TARGET_FILES) {
    const filePath = path.join(GENERATED_DIR, fileName);
    const patched = await patchFile(filePath);
    patchedAnyFile ||= patched;
  }

  if (patchedAnyFile) {
    console.log("✅ Hey API headers callback types fixed");
    return;
  }

  console.log("ℹ️ No Hey API headers callback found to patch");
}

main();
