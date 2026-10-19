import { expect, test, type Page } from "@playwright/test";

async function chooseFirstOpenSlot(page: Page) {
  const radio = page.locator('input[name="slot"]:not([disabled])').first();
  await radio.check();
  return radio.inputValue();
}

test("browse, choose a date and reach the mock payment page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kamakura");
  await expect(page.getByRole("note")).toContainText("Preview with sample data");

  await page.getByRole("link", { name: "Find an experience" }).click();
  await expect(page).toHaveURL(/\/experiences$/);
  await page.getByRole("link", { name: "Home-style dinner at a neighborhood table" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Home-style dinner at a neighborhood table");
  await expect(page.getByText("All times are Japan time (JST).")).toBeVisible();
  await chooseFirstOpenSlot(page);
  await page.getByRole("spinbutton", { name: "Guests" }).fill("2");
  await expect(page.getByText("Estimated total ¥13,600")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/book\?slot=.+&guests=2/);
  const summary = page.getByRole("complementary", { name: "Booking summary" });
  await expect(summary).toContainText("¥13,600");
  await expect(summary).toContainText("tax included");
  await expect(summary).toContainText("JST");
  await expect(summary).toContainText("Sold by Sample Seller (synthetic)");

  await page.getByLabel("Full name").fill("Sample Guest");
  await page.getByLabel("Email").fill("guest@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue to mock payment" }).click();

  await expect(page).toHaveURL(/\/preview\/checkout\?/);
  expect(page.url()).not.toContain("example.com");
  expect(page.url()).not.toContain("Sample%20Guest");
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);

  await page.getByRole("link", { name: "Simulate completed payment" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("confirming your booking");
  await expect(page.getByText("Your booking is not confirmed yet")).toBeVisible();
});

test("cancelled payment returns to the same selection", async ({ page }) => {
  await page.goto("/experiences/morning-hill-walk-and-tea");
  await chooseFirstOpenSlot(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("complementary", { name: "Booking summary" })).toContainText("¥14,000");
  await page.getByLabel("Full name").fill("Sample Guest");
  await page.getByLabel("Email").fill("guest@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue to mock payment" }).click();
  await page.getByRole("link", { name: "Simulate cancel" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("No payment was taken");
  await page.getByRole("link", { name: "Return to booking" }).click();
  await expect(page.getByRole("complementary", { name: "Booking summary" })).toContainText("¥14,000");
});

test("validation and API failures keep the guest's input", async ({ page }) => {
  await page.goto("/experiences/neighborhood-dinner-table");
  await chooseFirstOpenSlot(page);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Continue to mock payment" }).click();
  const alert = page.locator("main").getByRole("alert");
  await expect(alert).toContainText("Please check your details");
  await expect(alert).toContainText("Full name");
  await expect(alert).toContainText("Agreement to the cancellation terms");

  await page.getByLabel("Full name").fill("Sample Guest");
  await page.getByLabel("Email").fill("unavailable@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue to mock payment" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("couldn't reach the booking service");
  await expect(page.getByLabel("Full name")).toHaveValue("Sample Guest");
  await expect(page.getByLabel("Email")).toHaveValue("unavailable@example.com");

  await page.getByLabel("Email").fill("sold-out@example.com");
  await page.getByRole("button", { name: "Continue to mock payment" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("This time just filled up");
  await expect(page.getByRole("link", { name: "Choose another date" })).toBeVisible();
});

test("booking pages are private: no-store and noindex", async ({ request }) => {
  const res = await request.get("/experiences/neighborhood-dinner-table/book?slot=x&guests=1", { maxRedirects: 0 });
  expect(res.headers()["cache-control"]).toContain("no-store");
  expect(res.headers()["x-robots-tag"]).toContain("noindex");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /");
});
