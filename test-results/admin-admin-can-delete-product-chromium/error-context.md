# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> admin can delete product
- Location: e2e/admin.spec.ts:19:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e3]:
      - link "ShopAPI" [ref=e4] [cursor=pointer]:
        - /url: /
      - generic [ref=e5]:
        - link "Login" [ref=e6] [cursor=pointer]:
          - /url: /login
        - link "Register" [ref=e7] [cursor=pointer]:
          - /url: /register
  - main [ref=e8]:
    - generic [ref=e10]:
      - heading "Sign In" [level=1] [ref=e11]
      - generic [ref=e12]:
        - generic [ref=e13]: Invalid email or password.
        - generic [ref=e14]:
          - generic [ref=e15]: Email
          - textbox "you@example.com" [ref=e16]: admin@test.com
        - generic [ref=e17]:
          - generic [ref=e18]: Password
          - textbox "••••••••" [ref=e19]: password123
        - button "Sign In" [ref=e20]
      - paragraph [ref=e21]:
        - text: No account?
        - link "Register" [ref=e22] [cursor=pointer]:
          - /url: /register
  - button "Open Next.js Dev Tools" [ref=e28] [cursor=pointer]:
    - img [ref=e29]
  - alert [ref=e32]
```

# Test source

```ts
  1  | import { Page } from "@playwright/test";
  2  | import { PrismaClient } from "@prisma/client";
  3  | import { PrismaLibSql } from "@prisma/adapter-libsql";
  4  | 
  5  | function makePrisma() {
  6  |   const url = process.env.DATABASE_URL || "file:./test.db";
  7  |   const adapter = new PrismaLibSql({ url });
  8  |   return new PrismaClient({ adapter });
  9  | }
  10 | 
  11 | const prisma = makePrisma();
  12 | 
  13 | export async function resetDb() {
  14 |   await prisma.cartItem.deleteMany();
  15 |   await prisma.cart.deleteMany();
  16 |   await prisma.product.deleteMany();
  17 |   await prisma.user.deleteMany();
  18 | }
  19 | 
  20 | export async function seedTestData() {
  21 |   const bcrypt = await import("bcryptjs");
  22 |   const hash = await bcrypt.hash("password123", 10);
  23 | 
  24 |   const admin = await prisma.user.create({
  25 |     data: { email: "admin@test.com", password: hash, role: "admin" },
  26 |   });
  27 |   const user = await prisma.user.create({
  28 |     data: { email: "user@test.com", password: hash, role: "user" },
  29 |   });
  30 | 
  31 |   const p1 = await prisma.product.create({ data: { name: "Laptop", price: 999.99, stock: 10, description: "A fast laptop" } });
  32 |   const p2 = await prisma.product.create({ data: { name: "Mouse", price: 29.99, stock: 50 } });
  33 |   const p3 = await prisma.product.create({ data: { name: "Keyboard", price: 79.99, stock: 5 } });
  34 | 
  35 |   return { admin, user, products: [p1, p2, p3] };
  36 | }
  37 | 
  38 | export async function loginAsAdmin(page: Page) {
  39 |   await page.goto("/login");
  40 |   await page.getByTestId("login-email").fill("admin@test.com");
  41 |   await page.getByTestId("login-password").fill("password123");
  42 |   await page.getByTestId("login-submit").click();
> 43 |   await page.waitForURL("/");
     |              ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  44 | }
  45 | 
  46 | export async function loginAsUser(page: Page) {
  47 |   await page.goto("/login");
  48 |   await page.getByTestId("login-email").fill("user@test.com");
  49 |   await page.getByTestId("login-password").fill("password123");
  50 |   await page.getByTestId("login-submit").click();
  51 |   await page.waitForURL("/");
  52 | }
  53 | 
```