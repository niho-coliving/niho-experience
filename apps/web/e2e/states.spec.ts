import { expect, test } from "@playwright/test";

test("theme filter is shareable and survives back/forward", async ({ page }) => {
  await page.goto("/experiences");
  await page.getByRole("link", { name: "Craft", exact: true }).click();
  await expect(page).toHaveURL(/theme=craft/);
  await expect(page.getByRole("status")).toContainText("2 experiences in Craft");
  await expect(page.getByRole("link", { name: "Craft", exact: true })).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Home-style dinner" }).waitFor({ state: "detached" });

  await page.getByRole("link", { name: "Carve a small tray in the Kamakura-bori style" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Carve a small tray in the Kamakura-bori style");
  await page.goBack();
  await expect(page).toHaveURL(/theme=craft/);
  await expect(page.getByRole("status")).toContainText("in Craft");
  await page.getByRole("link", { name: "Clear all filters" }).click();
  await expect(page).toHaveURL(/\/experiences$/);
});

test("a date with nothing open shows a clear empty state", async ({ page }) => {
  await page.goto("/experiences?theme=food&date=2020-01-01");
  await expect(page.getByRole("heading", { name: "Nothing matches these filters" })).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL(/\/experiences$/);
});

test("fully booked and paused experiences cannot be booked", async ({ page }) => {
  await page.goto("/experiences/fish-market-breakfast");
  await expect(page.getByText("All upcoming dates are fully booked")).toBeVisible();
  await expect(page.locator('input[name="slot"]:not([disabled])')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);

  await page.goto("/experiences/backyard-indigo-dyeing");
  await expect(page.getByText("Bookings are paused")).toBeVisible();
  await expect(page.locator('input[name="slot"]')).toHaveCount(0);

  await page.goto("/experiences/backyard-indigo-dyeing/book?slot=anything&guests=1");
  await expect(page.locator("main").getByRole("alert")).toContainText("Bookings are paused");
});

test("API failure and unknown pages show a way forward", async ({ page }) => {
  await page.goto("/experiences?mock=error");
  await expect(page.locator("main").getByRole("alert")).toContainText("couldn't load experiences");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();

  const res = await page.goto("/experiences/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("isn't available");
});

test("host page does not offer a self sign-up that isn't open", async ({ page }) => {
  await page.goto("/host");
  await expect(page.getByText("We're starting with a small group of hosts")).toBeVisible();
  await expect(page.getByRole("link", { name: /Start with your NIHO account/ })).toHaveCount(0);
  await expect(page.getByText("Complete identity and payout checks with Stripe")).toBeVisible();
});
