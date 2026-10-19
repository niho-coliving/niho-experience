import { expect, test } from "@playwright/test";

test("paused experience has no booking entry", async ({ page }) => {
  await page.goto("/experiences/evening-pottery-session");
  await expect(page.getByText(/Bookings are paused/).last()).toBeVisible();
  await expect(page.getByRole("link", { name: "Check dates and book" })).toHaveCount(0);
});
test("empty, unavailable, and unknown catalog states have a way forward", async ({ page }) => {
  await page.goto("/experiences?mock=empty");
  await expect(page.getByRole("heading", { name: "No experiences are listed right now" })).toBeVisible();
  await page.goto("/experiences?mock=error");
  await expect(page.locator("main").getByRole("alert")).toContainText("couldn't load experiences");
  const res = await page.goto("/experiences/does-not-exist");
  expect(res?.status()).toBe(404);
});
