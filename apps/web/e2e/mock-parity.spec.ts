import { expect, test } from "@playwright/test";

// The owner-approved phone mock (2026-10-20): next dates on cards, the list's round search button,
// and the booking page's two screens (date and party → details and checkout).

const dinner = "/experiences/home-cooked-dinner-with-locals";

test("cards show the next bookable dates once availability is read, on the home page and the list", async ({ page }) => {
  for (const path of ["/", "/experiences"]) {
    await page.goto(path);
    const card = page.locator("main article").filter({ has: page.getByRole("link", { name: /Home-cooked dinner/ }) });
    const dates = card.locator("[data-next-dates]");
    await expect(dates, path).toContainText("Next");
    const pills = dates.locator("span.rounded-full");
    expect(await pills.count(), path).toBeGreaterThanOrEqual(1);
    expect(await pills.count(), path).toBeLessThanOrEqual(3);
    await expect(pills.first(), path).toHaveText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d{1,2}$/);
    // Dates only: never the seats left.
    await expect(card, path).not.toContainText(/places? (currently )?(left|available)/);
  }
});

test("the list search opens from the round button, is a plain GET form, and stays open for a search word", async ({ page }) => {
  await page.goto("/experiences");
  const searchbox = page.getByRole("searchbox", { name: "Search experiences and hosts" });
  await expect(searchbox).toBeHidden();
  // A native <details>/<summary> with a GET form: it opens and submits without JavaScript.
  const form = page.locator('form[role="search"]');
  await expect(form).toHaveAttribute("method", "get");
  await expect(form).toHaveAttribute("action", "/experiences");
  await page.locator("summary").filter({ hasText: "Search" }).click();
  await expect(searchbox).toBeVisible();
  await searchbox.fill("pottery");
  await searchbox.press("Enter");
  await expect(page).toHaveURL(/\/experiences\?q=pottery/);
  await expect(page.getByRole("link", { name: /evening pottery session/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /home-cooked dinner/i })).toHaveCount(0);
  // Arriving with a search word opens the search with the word in it.
  await page.goto("/experiences?q=pottery");
  await expect(page.getByRole("searchbox", { name: "Search experiences and hosts" })).toHaveValue("pottery");
  await expect(page.getByRole("searchbox", { name: "Search experiences and hosts" })).toBeVisible();
});

test("the booking page keeps two screens: date and party first, then details and checkout", async ({ page }) => {
  await page.goto(`${dinner}/book`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Home-cooked dinner with locals in a shared living room");
  await expect(page.getByRole("link", { name: /Back to/ })).toHaveAttribute("href", dinner);

  // Step 1: date cards are radios (invisible but reachable by keyboard).
  await expect(page.getByRole("heading", { name: /step 1\s*Choose a date/ })).toBeVisible();
  const dates = page.getByRole("radiogroup", { name: /Choose a date/ });
  const first = dates.locator('input[name="occurrence"]:not([disabled])').first();
  await first.focus();
  await page.keyboard.press("Space");
  await expect(first).toBeChecked();

  // Step 2: −/+ change the same number inputs that can be typed into.
  await expect(page.getByRole("heading", { name: /step 2\s*Who's coming/ })).toBeVisible();
  const adults = page.getByRole("spinbutton", { name: "Adults" });
  await expect(adults).toHaveValue("1");
  await page.getByRole("button", { name: "More adults" }).click();
  await expect(adults).toHaveValue("2");
  await expect(page.getByText("¥13,000 total")).toBeVisible();
  await page.getByRole("button", { name: "Fewer adults" }).click();
  await expect(adults).toHaveValue("1");

  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: /step 3\s*Your details/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /step 4\s*Check and pay/ })).toBeVisible();
  await expect(page.getByText("¥6,500 total")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Home-cooked dinner with locals in a shared living room");

  await page.getByRole("button", { name: "Change date or guest count" }).click();
  await expect(page.getByRole("heading", { name: /step 1\s*Choose a date/ })).toBeVisible();
});

test("approval-based experiences ask the guest to check and send", async ({ page }) => {
  await page.goto("/experiences/indigo-dyeing-with-an-artisan/book");
  await page.locator('input[name="occurrence"]:not([disabled])').first().check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: /step 4\s*Check and send/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Request to book" })).toBeVisible();
});

test("previews say so once, in the footer, and photos carry no sample tags", async ({ page }) => {
  await page.goto("/");
  const note = page.getByRole("contentinfo").getByRole("note");
  await expect(note).toContainText("Preview");
  await expect(note).toContainText("API contract");
  await expect(page.getByText("Sample photo")).toHaveCount(0);
  await page.goto(dinner);
  await expect(page.getByText(/Sample listing|Details to be confirmed/)).toHaveCount(0);
});

test("the header marks Experiences on the list", async ({ page }) => {
  await page.goto("/experiences");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Experiences" })).toHaveAttribute("aria-current", "page");
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Experiences" })).not.toHaveAttribute("aria-current", "page");
});
