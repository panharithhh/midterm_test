import { test, expect } from "@playwright/test";
import { resetDb, seedTestData, loginAsAdmin } from "./helpers";

test.beforeEach(async () => {
  await resetDb();
  await seedTestData();
});

test("home page lists products", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("products-grid")).toBeVisible();
  const cards = page.getByTestId("product-card");
  await expect(cards).toHaveCount(3);
});

test("search filter narrows results", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("search-input").fill("Laptop");
  await expect(page.getByTestId("product-card")).toHaveCount(1);
  await expect(page.getByTestId("product-card").first()).toContainText("Laptop");
});

test("price filter narrows results", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("min-price").fill("50");
  await page.getByTestId("max-price").fill("200");
  const cards = page.getByTestId("product-card");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Keyboard");
});

test("clicking product navigates to detail page", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("product-card").first().locator("a").first().click();
  await expect(page).toHaveURL(/\/products\/\d+/);
  await expect(page.getByTestId("product-name")).toBeVisible();
});

test("detail page shows 404 for invalid id", async ({ page }) => {
  await page.goto("/products/99999");
  await expect(page.getByTestId("not-found")).toBeVisible();
});

test("admin can create a new product", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  await page.getByTestId("create-product-btn").click();
  await page.getByTestId("form-name").fill("New Gadget");
  await page.getByTestId("form-price").fill("49.99");
  await page.getByTestId("form-stock").fill("10");
  await page.getByTestId("modal-save-btn").click();
  await expect(page.getByTestId("success-message")).toContainText("created");
  await expect(page.getByText("New Gadget")).toBeVisible();
});
