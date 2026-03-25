import { promises as fs } from "node:fs";
import path from "node:path";

const DIR = "./generated/api";

async function replaceUnknownWithNull(file: string) {
  const content = await fs.readFile(file, "utf-8");
  const updated = content.replace(/\bunknown\b/g, "null");
  await fs.writeFile(file, updated);
}

async function main() {
  const files = await fs.readdir(DIR);
  for (const file of files) {
    if (file.endsWith(".ts")) {
      await replaceUnknownWithNull(path.join(DIR, file));
    }
  }
  console.log("✅ unknown replaced with null");
}

main();
