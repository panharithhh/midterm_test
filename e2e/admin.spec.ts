import { test, expect } from "@playwright/test";
import { resetDb, seedTestData, loginAsAdmin, loginAsUser } from "./helpers";

test.beforeEach(async () => {
  await resetDb();
  await seedTestData();
});

test("admin can edit product", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  await page.getByTestId("edit-product-btn").first().click();
  await page.getByTestId("form-name").fill("Updated Laptop");
  await page.getByTestId("modal-save-btn").click();
  await expect(page.getByTestId("success-message")).toContainText("updated");
  await expect(page.getByText("Updated Laptop")).toBeVisible();
});

test("admin can delete product", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  const rowsBefore = await page.getByTestId("product-row").count();
  page.once("dialog", (d) => d.accept());
  await page.getByTestId("delete-product-btn").first().click();
  await expect(page.getByTestId("success-message")).toContainText("deleted");
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByTestId("product-row")).toHaveCount(rowsBefore - 1);
});

test("admin can update inventory", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  await page.getByTestId("tab-inventory").click();
  const stockInput = page.getByTestId("stock-input").first();
  await stockInput.fill("99");
  await page.getByTestId("update-stock-btn").first().click();
  await expect(page.getByTestId("success-message")).toContainText("Stock updated");
});

test("admin inventory rejects negative stock (via API validation)", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  await page.getByTestId("tab-inventory").click();
  const stockInput = page.getByTestId("stock-input").first();
  await stockInput.fill("-5");
  await page.getByTestId("update-stock-btn").first().click();
  await expect(page.getByTestId("error-message")).toBeVisible();
});

test("non-admin cannot see admin link in nav", async ({ page }) => {
  await loginAsUser(page);
  await expect(page.getByTestId("nav-admin")).not.toBeVisible();
});
