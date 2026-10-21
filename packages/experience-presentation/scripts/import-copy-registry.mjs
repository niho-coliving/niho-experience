import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/import-copy-registry.mjs <authorized experience-site-contract.ts>");

const source = await readFile(resolve(input), "utf8");
const start = source.indexOf("export const EXPERIENCE_INTERFACE_COPY = copy({");
const end = source.indexOf("} as const);", start);
if (start < 0 || end < 0) throw new Error("Authorized public UI registry was not found");
const definitions = {};
const linePattern = /^  "([^"]+)": \{ default: ("(?:[^"\\]|\\.)*"), placeholders: \[([^\]]*)\] \},$/gm;
for (const match of source.slice(start, end).matchAll(linePattern)) {
  definitions[match[1]] = {
    default: JSON.parse(match[2]),
    placeholders: match[3].trim() ? match[3].split(",").map((value) => JSON.parse(value.trim())) : [],
  };
}
if (Object.keys(definitions).length !== 239) throw new Error(`Expected 239 public copy keys, found ${Object.keys(definitions).length}`);
const output = `${JSON.stringify({ schemaVersion: 1, definitions }, null, 2)}\n`;
await writeFile(new URL("../src/v1/copy-registry.json", import.meta.url), output);
