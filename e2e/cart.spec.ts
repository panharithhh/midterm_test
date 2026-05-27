import { test, expect } from "@playwright/test";
import { resetDb, seedTestData, loginAsUser } from "./helpers";

test.beforeEach(async () => {
  await resetDb();
  await seedTestData();
});

test("logged-in user adds product to cart", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/");
  await page.getByTestId("add-to-cart-btn").first().click();
  await expect(page.getByTestId("cart-feedback")).toContainText("Added to cart");
});

test("cart shows added items with correct subtotal", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/");
  await page.getByTestId("add-to-cart-btn").first().click();
  await page.waitForTimeout(500);
  await page.goto("/cart");
  await expect(page.getByTestId("cart-item")).toHaveCount(1);
  await expect(page.getByTestId("item-subtotal").first()).toContainText("$");
});

test("increase quantity updates subtotal", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/");
  await page.getByTestId("add-to-cart-btn").first().click();
  await page.waitForTimeout(500);
  await page.goto("/cart");
  const subtotalBefore = await page.getByTestId("item-subtotal").first().textContent();
  await page.getByTestId("qty-increase").first().click();
  await page.waitForTimeout(500);
  const subtotalAfter = await page.getByTestId("item-subtotal").first().textContent();
  expect(subtotalBefore).not.toBe(subtotalAfter);
});

test("decrease quantity updates subtotal", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/");
  await page.getByTestId("add-to-cart-btn").first().click();
  await page.waitForTimeout(500);
  await page.goto("/cart");
  await page.getByTestId("qty-increase").first().click();
  await page.waitForTimeout(500);
  const subtotalBefore = await page.getByTestId("item-subtotal").first().textContent();
  await page.getByTestId("qty-decrease").first().click();
  await page.waitForTimeout(500);
  const subtotalAfter = await page.getByTestId("item-subtotal").first().textContent();
  expect(subtotalBefore).not.toBe(subtotalAfter);
});

test("remove item removes from cart", async ({ page }) => {
  await loginAsUser(page);
  await page.goto("/");
  await page.getByTestId("add-to-cart-btn").first().click();
  await page.waitForTimeout(500);
  await page.goto("/cart");
  await expect(page.getByTestId("cart-item")).toHaveCount(1);
  await page.getByTestId("remove-item").first().click();
  await page.waitForTimeout(500);
  await expect(page.getByTestId("empty-cart")).toBeVisible();
});

test("adding more than stock shows error", async ({ page }) => {
  await loginAsUser(page);
  // Keyboard has stock of 5, try to add 6 times
  const cards = page.getByTestId("product-card");
  await page.goto("/");
  // Add keyboard 5 times
  for (let i = 0; i < 5; i++) {
    const keyboardCard = page.locator('[data-testid="product-card"]').filter({ hasText: "Keyboard" });
    await keyboardCard.getByTestId("add-to-cart-btn").click();
    await page.waitForTimeout(300);
  }
  const keyboardCard = page.locator('[data-testid="product-card"]').filter({ hasText: "Keyboard" });
  await keyboardCard.getByTestId("add-to-cart-btn").click();
  await expect(page.getByTestId("cart-feedback")).toContainText("stock");
  void cards;
});
