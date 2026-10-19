// 実 API（stg・本番）の公開応答を、mock と同じ契約で検証する（連携 A の受入で使う）。読み取りだけ・認証なし。
// checkout は送らない（実際の仮押さえを作らないため）。checkout の契約は NIHO 側の integration test と合成の Stripe で確かめる。
//
//   npm -C packages/api-client run verify:live -- --origin https://app-stg.niho.life [--region kamakura]
import { createContractValidator, findSensitiveValues } from "../src/testing/index.ts";

function argument(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

const origin = argument("origin");
if (!origin || !/^https:\/\/[^/]+$/.test(origin)) {
  console.error("usage: verify:live -- --origin https://<NIHO の公開 Web origin> [--region <key>]");
  process.exit(2);
}
const region = argument("region");
const validator = createContractValidator();
let failures = 0;

async function check(operationId: string, path: string, expectedCache: RegExp): Promise<unknown> {
  const response = await fetch(`${origin}${path}`, { headers: { accept: "application/json" }, redirect: "error" });
  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : null;
  const result = validator.validateResponse(operationId, response.status, body);
  const cacheControl = response.headers.get("cache-control") ?? "";
  const problems = [
    ...(result.ok ? [] : result.errors),
    ...(expectedCache.test(cacheControl) ? [] : [`Cache-Control が想定と違います: ${cacheControl || "(なし)"}`]),
    ...(response.headers.get("set-cookie") ? ["Set-Cookie を返しています"] : []),
    ...findSensitiveValues(body),
  ];
  if (problems.length > 0) {
    failures += 1;
    console.error(`NG ${operationId} ${response.status} ${path}`);
    problems.forEach((problem) => console.error(`   - ${problem}`));
  } else {
    console.log(`OK ${operationId} ${response.status} ${path}`);
  }
  return body;
}

const SHARED = /^public, max-age=([1-9]|[1-5][0-9]|60)(,|$)/;
const NO_STORE = /^no-store$/;

const catalog = (await check("listExperiences", `/api/public/experiences${region ? `?region=${encodeURIComponent(region)}` : ""}`, SHARED)) as {
  experiences?: Array<{ slug: string }>;
} | null;
for (const item of catalog?.experiences ?? []) {
  await check("getExperience", `/api/public/experiences/${encodeURIComponent(item.slug)}`, SHARED);
  await check("getExperienceAvailability", `/api/public/experiences/${encodeURIComponent(item.slug)}/availability`, NO_STORE);
}
await check("getExperience", "/api/public/experiences/zz-not-listed-check", NO_STORE);

if (failures > 0) {
  console.error(`${failures} 件が契約と一致しません`);
  process.exitCode = 1;
} else {
  console.log("すべて契約と一致しました");
}
