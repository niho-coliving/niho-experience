// 契約（contract/experience-public-api.openapi.json）から src/generated/openapi.ts を作る。
// `--check` は書き込まず、生成結果とコミット済みの型が違えば失敗する（CI の drift 検査）。
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import openapiTS, { astToString } from "openapi-typescript";

const contractUrl = new URL("../contract/experience-public-api.openapi.json", import.meta.url);
const outputPath = fileURLToPath(new URL("../src/generated/openapi.ts", import.meta.url));

const HEADER = [
  "// このファイルは scripts/gen-types.ts が contract/experience-public-api.openapi.json から生成する。手で編集しない。",
  "// 更新: npm -C packages/api-client run gen:types",
  "",
].join("\n");

export async function generateContractTypes(): Promise<string> {
  const document = JSON.parse(await readFile(contractUrl, "utf8"));
  const ast = await openapiTS(document, { alphabetize: true, exportType: true });
  return `${HEADER}${astToString(ast)}`;
}

async function main(): Promise<void> {
  const generated = await generateContractTypes();
  if (process.argv.includes("--check")) {
    const committed = await readFile(outputPath, "utf8").catch(() => "");
    if (committed !== generated) {
      console.error("src/generated/openapi.ts が契約と一致しません。npm -C packages/api-client run gen:types を実行してください。");
      process.exitCode = 1;
      return;
    }
    console.log("OK: src/generated/openapi.ts は契約と一致しています。");
    return;
  }
  await writeFile(outputPath, generated, "utf8");
  console.log("wrote src/generated/openapi.ts");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
