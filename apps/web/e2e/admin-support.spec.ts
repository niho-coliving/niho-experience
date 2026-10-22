import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const ADMIN_COOKIE = "__Secure-niho_admin_preview";

async function hostSignIn(page: Page) {
  await page.goto("/host");
  await page.getByRole("link", { name: "NIHO でログイン" }).click();
  await page.waitForURL(/\/host\/home/);
}

async function adminSignIn(page: Page) {
  await page.goto("/admin");
  await page.getByRole("button", { name: "合成Adminとして開く" }).click();
  await page.waitForURL(/\/admin\/bookings/);
}

const overflowX = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test("admin has a separate session and ordinary hosts cannot enter", async ({ page, context }) => {
  await page.goto("/admin/bookings");
  await expect(page).toHaveURL(/\/admin$/);
  await hostSignIn(page);
  await page.goto("/admin/bookings");
  await expect(page).toHaveURL(/\/admin$/);
  await adminSignIn(page);
  await expect(page.getByRole("heading", { level: 1, name: "予約支援" })).toBeVisible();
  const cookie = (await context.cookies()).find((item) => item.name === ADMIN_COOKIE);
  expect(cookie).toMatchObject({ path: "/admin", httpOnly: true, secure: true, sameSite: "Lax" });
  expect((await context.cookies()).find((item) => item.name === "__Secure-niho_host_session")?.path).toBe("/host");
  const headers = (await page.goto("/admin/bookings"))!.headers();
  expect(headers["cache-control"]).toContain("no-store");
  expect(headers["x-robots-tag"]).toContain("noindex");
  expect(await page.locator('script[src*="umami"]').count()).toBe(0);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
});

test("admin searches across hosts and reads ON and OFF booking details", async ({ page }) => {
  await adminSignIn(page);
  const search = page.getByRole("searchbox", { name: "予約番号・予約者を検索" });
  await search.fill("2101");
  await expect(page.getByRole("region", { name: "予約一覧" })).toContainText("Amelia Jones");
  await expect(page.getByRole("region", { name: "予約一覧" })).not.toContainText("Lucas");
  await search.fill("");
  await page.getByRole("combobox", { name: "サポート" }).selectOption("off");
  await expect(page.getByRole("region", { name: "予約一覧" })).toContainText("支援OFF");
  await page.getByRole("button", { name: /Amelia Jones/ }).click();
  const detail = page.getByRole("article");
  await expect(detail).toContainText("手数料 10%（受付時）");
  await expect(detail).toContainText("閲覧だけができます");
  await expect(detail.getByRole("button", { name: "承認する" })).toHaveCount(0);
});

test("browser history keeps the selected booking in sync with the URL", async ({ page }) => {
  await adminSignIn(page);
  await page.getByRole("button", { name: /Lucas & Mia Chen/ }).click();
  await expect(page).toHaveURL(/booking=bk-2041/);
  await expect(page.getByRole("article")).toContainText("Lucas & Mia Chen");
  await page.getByRole("button", { name: /Amelia Jones/ }).click();
  await expect(page).toHaveURL(/booking=bk-studio-101/);
  await expect(page.getByRole("article")).toContainText("Amelia Jones");

  await page.goBack();
  await expect(page).toHaveURL(/booking=bk-2041/);
  await expect(page.getByRole("article")).toContainText("Lucas & Mia Chen");
  await page.goForward();
  await expect(page).toHaveURL(/booking=bk-studio-101/);
  await expect(page.getByRole("article")).toContainText("Amelia Jones");
});

test("busy action dialog ignores Escape and does not report into another booking", async ({ page }) => {
  await adminSignIn(page);
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>((resolve) => { releaseResponse = resolve; });
  await page.route("**/admin/api/preview-action", async (route) => {
    const response = await route.fetch();
    await responseGate;
    await route.fulfill({ response });
  });

  await page.getByRole("button", { name: /Lucas & Mia Chen/ }).click();
  const detail = page.getByRole("article");
  await detail.getByRole("button", { name: "承認する" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("対応理由").fill("応答待ちの操作");
  await dialog.getByRole("button", { name: "予約を承認する" }).click();
  await expect(dialog.getByRole("button", { name: "処理しています…" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();

  await page.evaluate(() => window.history.pushState(null, "", "/admin/bookings?booking=bk-studio-101"));
  await expect(page.getByRole("article")).toContainText("Amelia Jones");
  releaseResponse();
  await expect(page.getByRole("article")).toContainText("Amelia Jones");
  await expect(page.getByRole("article").getByRole("status")).toHaveCount(0);
});

test("support ON operation confirms counterpart, amount and reason, then audits the actor", async ({ page }) => {
  await adminSignIn(page);
  await page.getByRole("button", { name: /Lucas & Mia Chen/ }).click();
  const detail = page.getByRole("article");
  await expect(detail).toContainText("手数料 15%（受付時）");
  await expect(detail).toContainText("承認期限が近づいています");
  await detail.getByRole("button", { name: "承認する" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Lucas & Mia Chen／サンプルの台所");
  await expect(dialog).toContainText("¥60,000 を決済");
  await dialog.getByLabel("対応理由").fill("ホストと受入条件を確認しました");
  await dialog.getByRole("button", { name: "予約を承認する" }).click();
  await expect(detail.getByRole("status")).toContainText("予約を承認しました");
  await expect(detail).toContainText("NIHO サポート 山本");
  await expect(detail).toContainText("承認 · ホストと受入条件を確認しました");
  await page.reload();
  await expect(page.getByRole("article")).toContainText("確定");
  await expect(page.getByRole("article")).toContainText("承認 · ホストと受入条件を確認しました");
});

test("preview POST rejects cross-site and signed-out calls", async ({ page }) => {
  await page.goto("/admin");
  const signedOut = await page.evaluate(() => fetch("/admin/api/preview-action", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": "signedout1" }, body: JSON.stringify({ bookingId: "bk-2041", operation: { action: "approve", reason: "確認" } }) }).then((response) => response.status));
  expect(signedOut).toBe(401);
  await adminSignIn(page);
  const crossSite = await page.request.post("/admin/api/preview-action", { headers: { origin: "https://evil.example.test", "sec-fetch-site": "cross-site", "idempotency-key": "crosssite1" }, data: { bookingId: "bk-2041", operation: { action: "approve", reason: "確認" } } });
  expect(crossSite.status()).toBe(403);
});

test("an idempotency key converges only for the same booking and payload", async ({ page }) => {
  await adminSignIn(page);
  const statuses = await page.evaluate(async () => {
    const send = (reason: string) => fetch("/admin/api/preview-action", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": "same-key-123" }, body: JSON.stringify({ bookingId: "bk-garden-301", operation: { action: "contact", reason } }) });
    const first = await send("ホストへ候補者を共有");
    const repeat = await send("ホストへ候補者を共有");
    const mismatch = await send("別の内容へ変更");
    return [first.status, repeat.status, mismatch.status];
  });
  expect(statuses).toEqual([200, 200, 409]);
});

test("host settings explain 10/15 percent and no retroactive change", async ({ page }) => {
  await hostSignIn(page);
  await page.goto("/host/settings");
  const support = page.getByRole("region", { name: "NIHOサポート" });
  await expect(support).toContainText("サポートOFFは手数料10%、ONは合計15%");
  await expect(support).toContainText("ホストから担当者へ別途直接支払います");
  await support.getByRole("radio", { name: /サポートOFF/ }).check();
  await support.getByRole("button", { name: "サポート設定を保存" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("既存予約の手数料と支援条件は変わりません");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "変更を保存" }).click();
  await expect(support.getByRole("status")).toContainText("既存予約の条件は変わりません");
  await page.goto("/host/bookings?booking=bk-2041");
  await expect(page.getByRole("region", { name: "NIHOサポート" })).toContainText("手数料 15%（受付時）");
  await expect(page.getByRole("region", { name: "NIHOサポート" })).toContainText("NIHO サポート 佐藤");
  await page.goto("/host/bookings?booking=bk-2038");
  await expect(page.getByRole("region", { name: "NIHOサポート" })).toContainText("手数料 10%（受付時）");
  await expect(page.getByRole("region", { name: "NIHOサポート" })).toContainText("現在の設定を変えても、受付時の条件は変わりません");
});

test.describe("admin accessibility and responsive layout", () => {
  test("keyboard, desktop and WCAG checks", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "host-desktop");
    await adminSignIn(page);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "本文へ移動" })).toBeFocused();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    expect(results.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
    expect(await overflowX(page)).toBeLessThanOrEqual(0);
  });

  test("320px keeps list and detail inside the viewport", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "host-mobile-360");
    await page.setViewportSize({ width: 320, height: 640 });
    await adminSignIn(page);
    expect(await overflowX(page)).toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: /Lucas & Mia Chen/ }).click();
    await expect(page.getByRole("button", { name: "予約支援へ戻る" })).toBeVisible();
    expect(await overflowX(page)).toBeLessThanOrEqual(0);
  });
});

