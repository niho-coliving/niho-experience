// 実 API（stg・本番）の公開 GET 応答を、mock と同じ契約で検証する（読み取りだけ・認証なし）。
// checkout は送らない（実際の仮押さえを作らないため）。checkout/UTM/DNT は docs/production-deploy.md の安全な stg 手順で確かめる。
//
//   npm -C packages/api-client run verify:live -- --origin https://app-stg.niho.life --api-version 1.1 --expect-private-meeting-slug synthetic-private-meeting
//   npm -C packages/api-client run verify:live -- --origin https://app-stg.niho.life --api-version 1.2 --region kamakura --theme FOOD --available-on 2026-11-06 --expect-slug synthetic-food-on-date --expect-theme-excluded-slug synthetic-craft-on-date --expect-date-excluded-slug synthetic-food-other-date --expect-private-meeting-slug synthetic-private-meeting
import { createContractValidator, findSensitiveValues } from "../src/testing/index.ts";

const V12_THEMES = ["FOOD", "CULTURE", "CRAFT", "OUTDOORS", "LOCAL_LIFE"] as const;

type CatalogExperience = Record<string, unknown>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function catalogExperiences(value: unknown): CatalogExperience[] {
  return isObject(value) && Array.isArray(value.experiences) ? value.experiences.filter(isObject) : [];
}

function catalogSlugs(value: unknown): string[] {
  return catalogExperiences(value).flatMap((experience) => typeof experience.slug === "string" ? [experience.slug] : []);
}

function queryPath(path: string, values: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined) query.set(key, value);
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

function argument(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

const origin = argument("origin");
const apiVersion = argument("api-version") ?? "1.0";
const region = argument("region") ?? undefined;
const theme = argument("theme") ?? undefined;
const availableOn = argument("available-on") ?? undefined;
const expectedSlug = argument("expect-slug") ?? undefined;
const expectedThemeExcludedSlug = argument("expect-theme-excluded-slug") ?? undefined;
const expectedDateExcludedSlug = argument("expect-date-excluded-slug") ?? undefined;
const expectedPrivateMeetingSlug = argument("expect-private-meeting-slug") ?? undefined;
const isValidLocalDate = (value: string | undefined): value is string => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

if (!origin || !/^https:\/\/[^/]+$/.test(origin) || !["1.0", "1.1", "1.2"].includes(apiVersion)) {
  console.error("usage: verify:live -- --origin https://<NIHO の公開 Web origin> [--api-version 1.0|1.1|1.2] [--region <key>]");
  process.exit(2);
}
if (apiVersion !== "1.0" && (!expectedPrivateMeetingSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(expectedPrivateMeetingSlug))) {
  console.error("v1.1/v1.2 では公開概要を持つ AFTER_BOOKING の合成商品を --expect-private-meeting-slug <slug> で指定してください");
  process.exit(2);
}
if (apiVersion === "1.2" && (!theme || !V12_THEMES.includes(theme as (typeof V12_THEMES)[number]) || !isValidLocalDate(availableOn) || !expectedSlug || !expectedThemeExcludedSlug || !expectedDateExcludedSlug)) {
  console.error("v1.2 では --theme <FOOD|CULTURE|CRAFT|OUTDOORS|LOCAL_LIFE> --available-on <YYYY-MM-DD> と、各フィルターの一致・不一致を確認できる3つの合成slug指定が必要です");
  process.exit(2);
}

const validator = createContractValidator();
let failures = 0;

async function check(operationId: string, path: string, expectedCache: RegExp): Promise<unknown> {
  const response = await fetch(`${origin}${path}`, { headers: { accept: "application/json" }, redirect: "error" });
  const text = await response.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* reported as an invalid response shape below */ }
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

const listOperation = apiVersion === "1.0" ? "listPublicExperiences" : apiVersion === "1.1" ? "listPublicExperiencesV11" : "listPublicExperiencesV12";
const listPath = apiVersion === "1.0" ? "/api/public/experiences" : `/api/public/experiences/v${apiVersion}/catalog`;
const catalog = await check(listOperation, queryPath(listPath, { region }), SHARED);
const detailOperation = apiVersion === "1.0" ? "getPublicExperience" : "getPublicExperienceV11";
let verifiedPrivateMeeting = false;
for (const item of catalogExperiences(catalog)) {
  if (typeof item.slug !== "string") continue;
  const detailPath = apiVersion === "1.0"
    ? `/api/public/experiences/${encodeURIComponent(item.slug)}`
    : `/api/public/experiences/v1.1/${encodeURIComponent(item.slug)}`;
  const detail = await check(detailOperation, detailPath, SHARED);
  if (apiVersion !== "1.0" && item.slug === expectedPrivateMeetingSlug) {
    const experience = isObject(detail) && isObject(detail.experience) ? detail.experience : null;
    verifiedPrivateMeeting = experience?.slug === expectedPrivateMeetingSlug
      && typeof experience.meetingOverview === "string" && experience.meetingOverview.trim().length > 0
      && experience.meetingPointDisclosure === "AFTER_BOOKING" && experience.meetingPoint === null;
  }
  await check("getPublicExperienceAvailability", `/api/public/experiences/${encodeURIComponent(item.slug)}/availability`, NO_STORE);
}
if (apiVersion !== "1.0") {
  if (!verifiedPrivateMeeting) {
    failures += 1;
    console.error("NG private meeting fixture: 一覧掲載・空でない公開概要・AFTER_BOOKING・meetingPoint:null の確認が必要です");
  } else {
    console.log("OK private meeting fixture: 公開概要と非公開集合情報の除外を確認しました");
  }
}
const notListedPath = apiVersion === "1.0"
  ? "/api/public/experiences/zz-not-listed-check"
  : "/api/public/experiences/v1.1/zz-not-listed-check";
await check(detailOperation, notListedPath, NO_STORE);

if (apiVersion === "1.2" && theme && availableOn && expectedSlug && expectedThemeExcludedSlug && expectedDateExcludedSlug) {
  const params = { region, theme, availableOn };
  const byTheme = await check("listPublicExperiencesV12", queryPath(listPath, { region, theme }), SHARED);
  const byDate = await check("listPublicExperiencesV12", queryPath(listPath, { region, availableOn }), SHARED);
  const byThemeAndDate = await check("listPublicExperiencesV12", queryPath(listPath, params), SHARED);
  const baseSlugs = new Set(catalogSlugs(catalog));
  const themeSlugs = new Set(catalogSlugs(byTheme));
  const dateSlugs = new Set(catalogSlugs(byDate));
  const combinedSlugs = catalogSlugs(byThemeAndDate);

  function expectSlug(label: string, result: unknown, slug: string, included: boolean): void {
    const actual = catalogSlugs(result).includes(slug);
    if (actual !== included) {
      failures += 1;
      console.error(`NG ${label}: 合成 fixture ${slug} は${included ? "含まれる" : "除外される"}想定です`);
    } else {
      console.log(`OK ${label}: ${slug}`);
    }
  }

  const expectedByList = [
    ["base catalog", catalog, expectedSlug, true],
    ["base catalog", catalog, expectedThemeExcludedSlug, true],
    ["base catalog", catalog, expectedDateExcludedSlug, true],
    ["theme filter", byTheme, expectedSlug, true],
    ["theme filter", byTheme, expectedThemeExcludedSlug, false],
    ["theme filter", byTheme, expectedDateExcludedSlug, true],
    ["date filter", byDate, expectedSlug, true],
    ["date filter", byDate, expectedThemeExcludedSlug, true],
    ["date filter", byDate, expectedDateExcludedSlug, false],
    ["combined filters", byThemeAndDate, expectedSlug, true],
    ["combined filters", byThemeAndDate, expectedThemeExcludedSlug, false],
    ["combined filters", byThemeAndDate, expectedDateExcludedSlug, false],
  ] as const;
  for (const [label, result, slug, included] of expectedByList) expectSlug(label, result, slug, included);

  for (const result of [catalog, byTheme, byDate, byThemeAndDate]) {
    if (catalogSlugs(result).some((slug) => !baseSlugs.has(slug))) {
      failures += 1;
      console.error("NG v1.2 catalog: 絞り込み結果に基本一覧にない slug があります");
    }
  }

  for (const experience of catalogExperiences(byTheme)) {
    if (!Array.isArray(experience.themes) || !experience.themes.includes(theme)) {
      failures += 1;
      console.error(`NG theme filter: ${String(experience.slug)} に ${theme} がありません`);
    }
  }
  for (const slug of combinedSlugs) {
    if (!themeSlugs.has(slug) || !dateSlugs.has(slug)) {
      failures += 1;
      console.error(`NG combined filters: ${slug} が個別の絞り込み結果に含まれません`);
    }
  }
}

if (failures > 0) {
  console.error(`${failures} 件が契約と一致しません`);
  process.exitCode = 1;
} else {
  console.log("すべて契約と一致しました");
}
