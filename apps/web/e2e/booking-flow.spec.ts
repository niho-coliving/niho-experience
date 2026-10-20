import { expect, test, type Page } from "@playwright/test";

const dinner = "/experiences/home-cooked-dinner-with-locals";
async function chooseFirstDate(page: Page) {
  await page.locator('input[name="occurrence"]:not([disabled])').first().check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}
async function enterBookingDetails(page: Page) {
  await page.getByRole("textbox", { name: "Full name" }).fill("Sample Guest");
  await page.getByRole("textbox", { name: "Email" }).fill("guest@example.com");
  await page.getByRole("checkbox", { name: /agree to version/ }).check();
}

test("browse, review adult and child total, and reach browser-only mock checkout", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => { if (request.method() === "POST") requests.push(request.url()); });
  await page.goto("/");
  await page.getByRole("link", { name: "Find an experience" }).click();
  await page.getByRole("link", { name: /Home-cooked dinner/ }).click();
  await page.getByRole("link", { name: "Check dates and book" }).click();
  await expect(page).toHaveURL(/\/book$/);
  await page.getByRole("spinbutton", { name: /Adults/ }).fill("2");
  await page.getByRole("spinbutton", { name: /Children/ }).fill("1");
  // Availability varies by JST date; choose a slot that fits all three guests.
  await page.getByRole("radio", { name: /(?:[3-9]|[1-9]\d+) places currently available/ }).first().check();
  await expect(page.getByText("Total: ¥16,000")).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Total ¥16,000")).toBeVisible();
  await expect(page.getByText(/Sold by/)).toBeVisible();
  await page.getByRole("textbox", { name: "Full name" }).fill("Sample Guest");
  await page.getByRole("textbox", { name: "Email" }).fill("guest@example.com");
  await page.getByRole("checkbox", { name: /agree to version/ }).check();
  await page.getByRole("button", { name: "Continue to mock payment" }).click();
  await expect(page).toHaveURL(/\/preview\/checkout$/);
  expect(requests).toEqual([]);
  expect(page.url()).not.toContain("guest@example.com");
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
});

test("cancelled checkout return offers a clear way back to date selection on mobile and desktop", async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.goto(`${dinner}?checkout=cancelled`);
    const status = page.getByRole("status");
    await expect(status).toContainText("Checkout cancelled");
    await expect(status.getByRole("link", { name: "Choose a date" })).toHaveAttribute("href", `${dinner}/book`);
  }

  await page.getByRole("link", { name: "Choose a date" }).click();
  await expect(page).toHaveURL(/\/book$/);
});

test("provisional pilot dates do not claim remaining seats", async ({ page }) => {
  const pilot = process.env.MOCK_CATALOG === "pilot";
  const slug = pilot ? "kamakura-community-dinner" : "home-cooked-dinner-with-locals";
  await page.goto(`/experiences/${slug}/book`);

  if (pilot) {
    await expect(page.getByText("Sample date · availability not confirmed").first()).toBeVisible();
    await expect(page.getByText(/\d+ places? currently available/)).toHaveCount(0);
  } else {
    await expect(page.getByText(/\d+ places? currently available/).first()).toBeVisible();
  }
});

test("required booking answer and consent are shown before checkout", async ({ page }) => {
  await page.goto("/experiences/indigo-dyeing-with-an-artisan/book");
  await chooseFirstDate(page);
  await expect(page.getByRole("heading", { name: "Your booking" })).toBeVisible();
  await expect(page.getByLabel(/Which shade would you like to dye/)).toBeVisible();
  await expect(page.getByText(/version 2026-10-01/)).toBeVisible();
  await page.getByRole("textbox", { name: "Full name" }).fill("Sample Guest");
  await page.getByRole("textbox", { name: "Email" }).fill("guest@example.com");
  await page.getByRole("checkbox", { name: /agree to version/ }).check();
  await page.getByRole("button", { name: "Request to book" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("required question");
  await expect(page.getByRole("textbox", { name: "Full name" })).toHaveValue("Sample Guest");
  expect(await page.evaluate(() => (window as Window & { __nihoEvents?: { event: string }[] }).__nihoEvents?.filter((event) => event.event === "checkout_start").length ?? 0)).toBe(0);
});

test("booking page is private", async ({ request }) => {
  const res = await request.get(`${dinner}/book`);
  expect(res.headers()["cache-control"]).toContain("no-store");
  expect(res.headers()["x-robots-tag"]).toContain("noindex");
});

test("a newly full date can be checked again without trapping the guest", async ({ page }) => {
  await page.goto(`${dinner}/book?mock=checkout-full`);
  await chooseFirstDate(page);
  await page.getByRole("textbox", { name: "Full name" }).fill("Sample Guest");
  await page.getByRole("textbox", { name: "Email" }).fill("guest@example.com");
  await page.getByRole("checkbox", { name: /agree to version/ }).check();
  await page.getByRole("button", { name: "Continue to mock payment" }).click();
  await expect(page.locator("main").getByRole("alert").last()).toContainText("filled up");
  await page.getByRole("button", { name: "Check dates again" }).click();
  await page.locator('input[name="occurrence"]:not([disabled])').first().check();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
});

test("a changed price requires a fresh detail and agreement", async ({ page }) => {
  await page.goto(`${dinner}/book?mock=checkout-price-changed`);
  await chooseFirstDate(page);
  await page.getByRole("textbox", { name: "Full name" }).fill("Sample Guest");
  await page.getByRole("textbox", { name: "Email" }).fill("guest@example.com");
  await page.getByRole("checkbox", { name: /agree to version/ }).check();
  await page.getByRole("button", { name: "Continue to mock payment" }).click();
  await expect(page.getByRole("link", { name: "Reload the experience" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue to mock payment" })).toBeDisabled();
  await page.getByRole("link", { name: "Reload the experience" }).click();
  await expect(page).toHaveURL(new RegExp(`${dinner}$`));
});

test("a hold limit directs the guest to choose another date", async ({ page }) => {
  await page.goto(`${dinner}/book?mock=checkout-hold-limit`);
  await chooseFirstDate(page);
  await enterBookingDetails(page);
  await page.getByRole("button", { name: "Continue to mock payment" }).click();
  await expect(page.locator("main").getByRole("alert").last()).toContainText("different date");
  await expect(page.getByRole("textbox", { name: "Full name" })).toHaveValue("Sample Guest");

  await page.getByRole("button", { name: /Change date or guest count/ }).click();
  await page.locator('input[name="occurrence"]:not([disabled])').first().check();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
});

test("changed booking questions require a fresh detail before checkout", async ({ page }) => {
  await page.goto(`${dinner}/book?mock=checkout-questions-changed`);
  await chooseFirstDate(page);
  await enterBookingDetails(page);
  await page.getByRole("button", { name: "Continue to mock payment" }).click();
  await expect(page.getByRole("link", { name: "Reload the experience" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue to mock payment" })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "Full name" })).toHaveValue("Sample Guest");
});

test("an unavailable checkout keeps the guest's details available for retry", async ({ page }) => {
  await page.goto(`${dinner}/book?mock=checkout-unavailable`);
  await chooseFirstDate(page);
  await enterBookingDetails(page);
  await page.getByRole("button", { name: "Continue to mock payment" }).click();
  await expect(page.locator("main").getByRole("alert").last()).toContainText("details are still here");
  await expect(page.getByRole("textbox", { name: "Full name" })).toHaveValue("Sample Guest");
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue("guest@example.com");
  await expect(page.getByRole("button", { name: "Continue to mock payment" })).toBeEnabled();
});

test("a rate limit gives the retry delay and prevents an early resubmission", async ({ page }) => {
  await page.goto(`${dinner}/book?mock=checkout-rate-limited`);
  await chooseFirstDate(page);
  await enterBookingDetails(page);
  await page.getByRole("button", { name: "Continue to mock payment" }).click();
  await expect(page.locator("main").getByRole("alert").last()).toContainText("120 seconds");
  await expect(page.getByRole("button", { name: "Please wait…" })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "Full name" })).toHaveValue("Sample Guest");
});

test("a failing analytics sink never blocks a preview booking", async ({ page }) => {
  await page.addInitScript(() => {
    console.debug = () => { throw new Error("analytics blocked"); };
  });
  await page.goto(`${dinner}/book`);
  await chooseFirstDate(page);
  await page.getByRole("textbox", { name: "Full name" }).fill("Sample Guest");
  await page.getByRole("textbox", { name: "Email" }).fill("guest@example.com");
  await page.getByRole("checkbox", { name: /agree to version/ }).check();
  await page.getByRole("button", { name: "Continue to mock payment" }).click();
  await expect(page).toHaveURL(/\/preview\/checkout$/);
  const trackedEvents = await page.evaluate(() => (window as Window & { __nihoEvents?: { event: string }[] }).__nihoEvents?.map(({ event }) => event) ?? []);
  expect(trackedEvents).toContain("checkout_start");
});
