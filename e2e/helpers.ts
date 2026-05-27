import { Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function makePrisma() {
  const url = process.env.DATABASE_URL || "file:./test.db";
  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}

const prisma = makePrisma();

export async function resetDb() {
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedTestData() {
  const bcrypt = await import("bcryptjs");
  const hash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: { email: "admin@test.com", password: hash, role: "admin" },
  });
  const user = await prisma.user.create({
    data: { email: "user@test.com", password: hash, role: "user" },
  });

  const p1 = await prisma.product.create({ data: { name: "Laptop", price: 999.99, stock: 10, description: "A fast laptop" } });
  const p2 = await prisma.product.create({ data: { name: "Mouse", price: 29.99, stock: 50 } });
  const p3 = await prisma.product.create({ data: { name: "Keyboard", price: 79.99, stock: 5 } });

  return { admin, user, products: [p1, p2, p3] };
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("admin@test.com");
  await page.getByTestId("login-password").fill("password123");
  await page.getByTestId("login-submit").click();
  await page.waitForURL("/");
}

export async function loginAsUser(page: Page) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill("user@test.com");
  await page.getByTestId("login-password").fill("password123");
  await page.getByTestId("login-submit").click();
  await page.waitForURL("/");
}
