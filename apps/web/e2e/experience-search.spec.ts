import { expect, test } from "@playwright/test";

test("search filters the server-rendered list and browser history restores the URL state", async ({ page }) => {
  await page.goto("/experiences");
  await page.getByRole("searchbox", { name: "Search experiences and hosts" }).fill("POTTERY");
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();

  await expect(page).toHaveURL(/\/experiences\?q=POTTERY&theme=&date=$/);
  await expect(page.getByRole("status")).toContainText("1 experience");
  await expect(page.getByRole("link", { name: /evening pottery session/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /home-cooked dinner/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Clear filters" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/experiences$/);
  await expect(page.getByRole("status")).toContainText("4 experiences");
  await page.goForward();
  await expect(page).toHaveURL(/\/experiences\?q=POTTERY&theme=&date=$/);
  await expect(page.getByRole("status")).toContainText("1 experience");
});

test("an unmatched search explains how to clear it", async ({ page }) => {
  await page.goto("/experiences?q=not-a-real-experience");
  await expect(page.getByRole("heading", { name: "No experiences match your search" })).toBeVisible();
  await page.getByRole("link", { name: "Clear search" }).click();
  await expect(page).toHaveURL(/\/experiences$/);
  await expect(page.getByRole("status")).toContainText("4 experiences");
});

test("theme and scheduled-date filters stay in the URL and restore with browser history", async ({ page }) => {
  const todayJst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const daysUntilFriday = (5 - todayJst.getUTCDay() + 7) % 7 || 7;
  const friday = new Date(todayJst.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await page.goto("/experiences");
  await page.getByLabel("Theme").selectOption("FOOD");
  await page.getByLabel("Date").fill(friday);
  await page.getByRole("button", { name: "Apply filters" }).click();

  await expect(page).toHaveURL(new RegExp(`/experiences\\?q=&theme=FOOD&date=${friday}$`));
  await expect(page.getByRole("status")).toContainText("1 experience");
  await expect(page.getByRole("link", { name: /home-cooked dinner/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Clear filters" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/experiences$/);
  await expect(page.getByRole("status")).toContainText("4 experiences");
  await page.goForward();
  await expect(page.getByRole("status")).toContainText("1 experience");
});

test("first-touch booking attribution survives client navigation through filters", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "__nihoDocumentMarker", { value: crypto.randomUUID(), configurable: true });
  });
  await page.goto("/experiences?utm_source=niho_site&utm_campaign=pilot_2026q4");
  const documentMarker = await page.evaluate(() => (window as Window & { __nihoDocumentMarker?: string }).__nihoDocumentMarker);

  await page.getByLabel("Theme").selectOption("FOOD");
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(page).toHaveURL(/\/experiences\?q=&theme=FOOD&date=$/);
  await expect(page.getByRole("link", { name: /home-cooked dinner/i })).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { __nihoDocumentMarker?: string }).__nihoDocumentMarker)).toBe(documentMarker);

  await page.getByRole("link", { name: /home-cooked dinner/i }).click();
  await page.getByRole("link", { name: "Check dates and book" }).click();
  await page.locator('input[name="occurrence"]:not([disabled])').first().check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("Sample Guest");
  await page.getByRole("textbox", { name: "Email" }).fill("guest@example.com");
  await page.getByRole("checkbox", { name: /agree to version/ }).check();
  await page.getByRole("button", { name: "Continue to mock payment" }).click();
  await expect(page).toHaveURL(/\/preview\/checkout$/);
  expect(await page.evaluate(() => (window as Window & { __nihoDocumentMarker?: string }).__nihoDocumentMarker)).toBe(documentMarker);
  expect(page.url()).not.toContain("utm_");
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
});
