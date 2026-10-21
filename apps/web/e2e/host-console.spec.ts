import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Runs against the second server (HOST_CONSOLE_ENABLED=true, mock mode); see playwright.config.ts.
const SESSION_COOKIE = "__Secure-niho_host_session";

async function signIn(page: Page, query = "") {
  await page.goto(`/host${query}`);
  await page.getByRole("link", { name: "NIHO でログイン" }).click();
  await page.waitForURL(/\/host\/home(\?|$)/);
}

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

async function noHorizontalScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test("a host signs in from /host, switches provider, opens a section and signs out", async ({ page, context }) => {
  // /host stays the public introduction: only the pages below it are private.
  expect((await page.goto("/host"))!.headers()["x-robots-tag"]).toBeUndefined();
  // The traveler page keeps its (preview) measurement.
  await expect.poll(() => page.evaluate(() => Array.isArray((window as Window & { __nihoEvents?: unknown[] }).__nihoEvents))).toBe(true);
  await expect(page.getByRole("link", { name: "Manage your experiences on NIHO" })).toHaveCount(0);

  await page.getByRole("link", { name: "NIHO でログイン" }).click();
  await page.waitForURL(/\/host\/home$/);
  await expect(page.getByRole("heading", { level: 1, name: /サンプル ホスト さん、\s?こんにちは/ })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");

  // The console root has no analytics, no site chrome and nothing in browser storage.
  expect(await page.locator('script[src*="umami"]').count()).toBe(0);
  expect(await page.evaluate(() => "__nihoEvents" in window)).toBe(false);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  await expect(page.getByText("Preview with sample data")).toHaveCount(0);
  const cookie = (await context.cookies()).find((c) => c.name === SESSION_COOKIE);
  expect(cookie).toMatchObject({ path: "/host", httpOnly: true, secure: true, sameSite: "Lax" });

  const headers = (await page.goto("/host/home"))!.headers();
  expect(headers["cache-control"]).toContain("no-store");
  expect(headers["x-robots-tag"]).toContain("noindex");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  const provider = page.getByRole("heading", { level: 2, name: "サンプルの台所" });
  await expect(provider).toBeVisible();
  await page.locator("summary", { hasText: "提供者" }).click();
  await page.getByRole("link", { name: /サンプル工房/ }).click();
  await page.waitForURL(/providerId=sample-provider-studio/);
  await expect(page.getByRole("heading", { level: 2, name: "サンプル工房" })).toBeVisible();
  await expect(page.getByText("あなたの役割：編集者")).toBeVisible();

  await page.getByRole("navigation", { name: "ホストのメニュー" }).getByRole("link", { name: "予約" }).click();
  await page.waitForURL("**/host/bookings?providerId=sample-provider-studio");
  await expect(page.getByRole("heading", { level: 1, name: "予約" })).toBeVisible();
  await expect(page.getByRole("link", { name: "予約" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("この画面は準備中です")).toBeVisible();

  await page.locator("summary", { hasText: "のアカウント" }).click();
  await page.getByRole("button", { name: "ログアウト" }).click();
  await page.waitForURL(/\/host$/);
  await expect(page.getByRole("link", { name: "NIHO でログイン" })).toBeVisible();
  expect((await context.cookies()).some((c) => c.name === SESSION_COOKIE)).toBe(false);
  await page.goto("/host/home");
  await expect(page).toHaveURL(/\/host$/);
});

test("an account without providers sees the registration entry", async ({ page }) => {
  await signIn(page, "?mock=empty");
  await expect(page.getByRole("heading", { name: "まず提供者として登録しましょう" })).toBeVisible();
  await expect(page.locator("summary", { hasText: "提供者" })).toHaveCount(0);
  await page.getByRole("link", { name: "提供者として登録" }).click();
  await page.waitForURL("**/host/register");
  await expect(page.getByText("この画面は準備中です")).toBeVisible();
});

test("/host?providerId= is carried through sign-in, and only a valid providerId", async ({ page }) => {
  await page.goto("/host?providerId=sample-provider-studio&next=https://example.test");
  await expect(page.getByRole("link", { name: "NIHO でログイン" })).toHaveAttribute("href", "/host/auth/login?providerId=sample-provider-studio");
  await page.getByRole("link", { name: "NIHO でログイン" }).click();
  await page.waitForURL("**/host/home?providerId=sample-provider-studio");
  await expect(page.getByRole("heading", { level: 2, name: "サンプル工房" })).toBeVisible();

  // Signed in: /host opens the console with that provider.
  await page.goto("/host?providerId=sample-provider-kitchen");
  await page.waitForURL("**/host/home?providerId=sample-provider-kitchen");
  await expect(page.getByRole("heading", { level: 2, name: "サンプルの台所" })).toBeVisible();

  await page.goto("/host/home?providerId=someone-else");
  await expect(page.locator("main").getByRole("alert")).toContainText("指定された提供者を開けませんでした");
});

test("an unusable providerId is not passed to the login", async ({ page }) => {
  await page.goto("/host?providerId=../../admin");
  await expect(page.getByRole("link", { name: "NIHO でログイン" })).toHaveAttribute("href", "/host/auth/login");
});

test("an expired ID token is refreshed once by the browser before the page shows", async ({ page }) => {
  const refreshes: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/host/auth/refresh") refreshes.push(request.method());
  });
  await page.goto("/host/auth/mock-login?expired=1");
  await expect(page.getByRole("heading", { level: 1, name: /サンプル ホスト さん、\s?こんにちは/ })).toBeVisible();
  expect(refreshes).toEqual(["POST"]);
});

test("the API relay serves the provider API to this site only", async ({ page }) => {
  await signIn(page);
  const result = await page.evaluate(async () => {
    const list = await fetch("/host/api/experience-providers");
    const other = await fetch("/host/api/users");
    const me = await fetch("/host/api/auth/me");
    // A same-origin change passes the Origin check (and reaches the mock, which has no write API yet).
    const change = await fetch("/host/api/experience-providers", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    return { list: list.status, providers: ((await list.json()) as { providers: unknown[] }).providers.length, other: other.status, me: me.status, change: change.status, cache: list.headers.get("cache-control") };
  });
  expect(result).toEqual({ list: 200, providers: 2, other: 404, me: 200, change: 501, cache: expect.stringContaining("no-store") });
  const crossSite = await page.request.post("/host/api/experience-providers", { headers: { origin: "https://evil.example.test" }, data: {} });
  expect(crossSite.status()).toBe(403);
});

test("signed-out visitors cannot open the console", async ({ page }) => {
  await page.goto("/host/home");
  await expect(page).toHaveURL(/\/host$/);
  const missing = await page.goto("/host/no-such-page");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "ページが見つかりません" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
});

test("login errors explain what happened and offer to try again", async ({ page }) => {
  await page.goto("/host/auth/callback?code=x&state=yyyyyyyyyyyyyyyyyyyyyyyy");
  await expect(page).toHaveURL(/\/host\/auth\/error\?reason=expired$/);
  await expect(page.locator("main").getByRole("alert")).toContainText("時間切れ");
  await expect(page.getByRole("link", { name: "もう一度ログイン" })).toHaveAttribute("href", "/host/auth/login");
});

test("keyboard users can skip to content and switch providers", async ({ page }) => {
  await signIn(page);
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "本文へ移動" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  const switcher = page.locator("summary", { hasText: "提供者" });
  await switcher.focus();
  await page.keyboard.press("Enter");
  const studio = page.getByRole("link", { name: /サンプル工房/ });
  await expect(studio).toBeVisible();
  await studio.focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/providerId=sample-provider-studio/);
  await expect(page.getByRole("heading", { level: 2, name: "サンプル工房" })).toBeVisible();
});

test("host pages have no serious accessibility violations and fit the screen", async ({ page }) => {
  await page.goto("/host");
  expect(await seriousViolations(page)).toEqual([]);
  await signIn(page);
  for (const path of ["/host/home", "/host/experiences"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await seriousViolations(page), path).toEqual([]);
    expect(await noHorizontalScroll(page), path).toBeLessThanOrEqual(0);
  }
  for (const menu of ["提供者", "のアカウント"]) {
    const summary = page.locator("summary", { hasText: menu });
    await summary.click();
    expect(await seriousViolations(page), `${menu} open`).toEqual([]);
    await summary.click();
  }
  await page.goto("/host/auth/error?reason=state");
  expect(await seriousViolations(page), "login error").toEqual([]);
});

test.describe("320px narrow phone", () => {
  test.use({ viewport: { width: 320, height: 640 } });
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "host-mobile-360"));

  test("the console frame and its menus fit", async ({ page }) => {
    await signIn(page);
    expect(await noHorizontalScroll(page)).toBeLessThanOrEqual(0);
    for (const label of ["ホーム", "体験", "予約", "売上", "設定"]) {
      const box = await page.getByRole("navigation", { name: "ホストのメニュー" }).getByRole("link", { name: label }).boundingBox();
      expect(box && box.x >= 0 && box.x + box.width <= 320, label).toBe(true);
    }
    await page.locator("summary", { hasText: "のアカウント" }).click();
    const logout = await page.getByRole("button", { name: "ログアウト" }).boundingBox();
    expect(logout && logout.x >= 0 && logout.x + logout.width <= 320).toBe(true);
    expect(await noHorizontalScroll(page)).toBeLessThanOrEqual(0);
  });
});
