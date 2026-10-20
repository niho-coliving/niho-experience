import { expect, test } from "@playwright/test";

const dinner = "/experiences/home-cooked-dinner-with-locals";

test("phones get a swipeable gallery and a booking bar that stays within reach", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-360");
  await page.goto(dinner);

  const gallery = page.getByRole("region", { name: /^Photos of/ });
  await expect(gallery).toBeVisible();
  await expect(page.getByText(/^1 \/ \d+$/)).toBeVisible();
  await gallery.evaluate((element) => element.scrollTo({ left: element.clientWidth, behavior: "instant" }));
  await expect(page.getByText(/^2 \/ \d+$/)).toBeVisible();
  await expect(page.getByLabel("All experiences")).toHaveAttribute("href", "/experiences");

  const book = page.getByRole("link", { name: "Check dates", exact: true });
  await expect(book).toBeInViewport();
  await page.getByRole("heading", { name: "Where you'll meet" }).scrollIntoViewIfNeeded();
  await expect(book).toBeInViewport();
  await book.click();
  await expect(page).toHaveURL(/\/book$/);
});

test("desktop shows every photo in a dialog and a next date opens the booking page with it selected", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto(dinner);

  await page.getByRole("button", { name: /^Show all \d+ photos$/ }).click();
  const dialog = page.getByRole("dialog", { name: "All photos" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img")).toHaveCount(4);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  const next = page.getByRole("complementary").getByRole("link", { name: /^Book / }).first();
  await expect(next).toBeVisible();
  const date = new URL((await next.getAttribute("href")) ?? "", "http://localhost").searchParams.get("date");
  expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await next.click();
  await expect(page).toHaveURL(/\/book\?date=/);
  await expect(page.locator('input[name="occurrence"]:checked')).toHaveValue(date ?? "");
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
});

test("same-time booking dates identify the option and its adult price", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/experiences/seaside-cycling-and-market-breakfast");

  const card = page.getByRole("complementary");
  const standard = card.getByRole("link", { name: /^Book .*Standard bike for ¥7,500 per adult$/ }).first();
  const eBike = card.getByRole("link", { name: /^Book .*E-bike for ¥9,800 per adult$/ }).first();
  await expect(standard).toBeVisible();
  await expect(eBike).toBeVisible();
  const standardOffer = new URL((await standard.getAttribute("href")) ?? "", "http://localhost").searchParams.get("offer");
  const eBikeOffer = new URL((await eBike.getAttribute("href")) ?? "", "http://localhost").searchParams.get("offer");
  expect(standardOffer).toBe("offer_cycling_standard");
  expect(eBikeOffer).toBe("offer_cycling_ebike");
});

test("the booking card states the terms before the booking page", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await page.goto("/experiences/indigo-dyeing-with-an-artisan");
  const card = page.getByRole("complementary");
  await expect(card).toContainText("Free cancellation until 48 h before");
  await expect(card).toContainText("Your hosts confirm each request — you're only charged if they accept");
  await expect(card).toContainText("No account needed");
  // Party size and totals belong to the booking page.
  await expect(card.getByRole("spinbutton")).toHaveCount(0);
  await expect(page.getByText("The meeting point is shared after your booking is confirmed.")).toBeVisible();
});
