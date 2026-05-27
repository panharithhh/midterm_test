import { test, expect } from "@playwright/test";
import { resetDb, seedTestData } from "./helpers";

test.beforeEach(async () => {
  await resetDb();
  await seedTestData();
});

test("register new user successfully", async ({ page }) => {
  await page.goto("/register");
  await page.getByTestId("register-email").fill("newuser@test.com");
  await page.getByTestId("register-password").fill("password123");
  await page.getByTestId("register-confirm").fill("password123");
  await page.getByTestId("register-submit").click();
  await page.waitForURL("/");
  await expect(page.getByTestId("nav-email")).toContainText("newuser@test.com");
});

test("register fails on duplicate email", async ({ page }) => {
  await page.goto("/register");
  await page.getByTestId("register-email").fill("user@test.com");
  await page.getByTestId("register-password").fill("password123");
  await page.getByTestId("register-confirm").fill("password123");
  await page.getByTestId("register-submit").click();
  await expect(page.getByTestId("error-message")).toContainText("Email already exists");
});

test("register fails on password mismatch", async ({ page }) => {
  await page.goto("/register");
  await page.getByTestId("register-email").fill("x@test.com");
  await page.getByTestId("register-password").fill("password123");
  await page.getByTestId("register-confirm").fill("different");
  await page.getByTestId("register-submit").click();
  await expect(page.getByTestId("error-message")).toContainText("Passwords do not match");
});

test("login successfully and redirects to home", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("user@test.com");
  await page.getByTestId("login-password").fill("password123");
  await page.getByTestId("login-submit").click();
  await page.waitForURL("/");
  await expect(page.getByTestId("nav-email")).toContainText("user@test.com");
});

test("login fails with wrong password", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("user@test.com");
  await page.getByTestId("login-password").fill("wrongpassword");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("error-message")).toContainText("Invalid email or password");
});

test("logout clears session and updates nav", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("user@test.com");
  await page.getByTestId("login-password").fill("password123");
  await page.getByTestId("login-submit").click();
  await page.waitForURL("/");
  await page.getByTestId("nav-logout").click();
  await expect(page.getByTestId("nav-login")).toBeVisible();
  await expect(page.getByTestId("nav-email")).not.toBeVisible();
});

test("accessing /cart without login redirects to /login", async ({ page }) => {
  await page.goto("/cart");
  await page.waitForURL("/login");
  await expect(page).toHaveURL("/login");
});

test("accessing /admin as non-admin redirects away", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("user@test.com");
  await page.getByTestId("login-password").fill("password123");
  await page.getByTestId("login-submit").click();
  await page.waitForURL("/");
  await page.goto("/admin");
  await page.waitForURL("/");
  await expect(page).toHaveURL("/");
});
