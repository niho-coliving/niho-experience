import { expect, test, type Page } from "@playwright/test";

const dinner = "/experiences/home-cooked-dinner-with-locals";
async function chooseFirstDate(page: Page) {
  await page.locator('input[name="occurrence"]:not([disabled])').first().check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
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
  await page.locator('input[name="occurrence"]:not([disabled])').first().check();
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
});

test("booking page is private", async ({ request }) => {
  const res = await request.get(`${dinner}/book`);
  expect(res.headers()["cache-control"]).toContain("no-store");
  expect(res.headers()["x-robots-tag"]).toContain("noindex");
});
