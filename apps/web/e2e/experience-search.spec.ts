import { expect, test } from "@playwright/test";

test("search filters the server-rendered list and browser history restores the URL state", async ({ page }) => {
  await page.goto("/experiences");
  await page.getByRole("searchbox", { name: "Search experiences and hosts" }).fill("POTTERY");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page).toHaveURL(/\/experiences\?q=POTTERY$/);
  await expect(page.getByRole("status")).toContainText("1 experience");
  await expect(page.getByRole("link", { name: /evening pottery session/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /home-cooked dinner/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Clear search" })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/experiences$/);
  await expect(page.getByRole("status")).toContainText("4 experiences");
  await page.goForward();
  await expect(page).toHaveURL(/\/experiences\?q=POTTERY$/);
  await expect(page.getByRole("status")).toContainText("1 experience");
});

test("an unmatched search explains how to clear it", async ({ page }) => {
  await page.goto("/experiences?q=not-a-real-experience");
  await expect(page.getByRole("heading", { name: "No experiences match your search" })).toBeVisible();
  await page.getByRole("link", { name: "Clear search" }).click();
  await expect(page).toHaveURL(/\/experiences$/);
  await expect(page.getByRole("status")).toContainText("4 experiences");
});
