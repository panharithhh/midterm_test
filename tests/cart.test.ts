import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { GET as getCart, POST as addToCart } from "@/app/api/cart/route";
import { PATCH as updateCartItem, DELETE as deleteCartItem } from "@/app/api/cart/[itemId]/route";
import { resetDb, makeRequest, createUser, tokenFor, testPrisma } from "./helpers";

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await testPrisma.$disconnect(); });

async function makeToken(email = "user@example.com", role = "user") {
  const u = await createUser(email, "password123", role);
  return { user: u, token: tokenFor(u.id, u.role) };
}

async function seedProduct(stock = 10) {
  return testPrisma.product.create({ data: { name: "Product", price: 9.99, stock } });
}

describe("POST /api/cart (add item)", () => {
  it("adds item to a new cart", async () => {
    const { token } = await makeToken();
    const p = await seedProduct();
    const req = makeRequest("/api/cart", {
      method: "POST",
      body: { productId: p.id, quantity: 2 },
      token,
    });
    const res = await addToCart(req);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.quantity).toBe(2);
  });

  it("increments quantity if item already in cart", async () => {
    const { user, token } = await makeToken();
    const p = await seedProduct(20);
    const cart = await testPrisma.cart.create({ data: { userId: user.id } });
    await testPrisma.cartItem.create({ data: { cartId: cart.id, productId: p.id, quantity: 3 } });

    const req = makeRequest("/api/cart", {
      method: "POST",
      body: { productId: p.id, quantity: 2 },
      token,
    });
    const res = await addToCart(req);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.quantity).toBe(5);
  });

  it("rejects when quantity exceeds stock", async () => {
    const { token } = await makeToken();
    const p = await seedProduct(3);
    const req = makeRequest("/api/cart", {
      method: "POST",
      body: { productId: p.id, quantity: 10 },
      token,
    });
    const res = await addToCart(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 for nonexistent product", async () => {
    const { token } = await makeToken();
    const req = makeRequest("/api/cart", {
      method: "POST",
      body: { productId: 9999, quantity: 1 },
      token,
    });
    const res = await addToCart(req);
    expect(res.status).toBe(404);
  });

  it("returns 401 without token", async () => {
    const req = makeRequest("/api/cart", {
      method: "POST",
      body: { productId: 1, quantity: 1 },
    });
    const res = await addToCart(req);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/cart", () => {
  it("returns empty cart for new user", async () => {
    const { token } = await makeToken();
    const req = makeRequest("/api/cart", { token });
    const res = await getCart(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.items).toEqual([]);
  });

  it("returns cart with items", async () => {
    const { user, token } = await makeToken();
    const p = await seedProduct();
    const cart = await testPrisma.cart.create({ data: { userId: user.id } });
    await testPrisma.cartItem.create({ data: { cartId: cart.id, productId: p.id, quantity: 2 } });

    const req = makeRequest("/api/cart", { token });
    const res = await getCart(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.items.length).toBe(1);
  });

  it("carts are isolated between users", async () => {
    const { user: u1, token: t1 } = await makeToken("u1@example.com");
    const { user: u2 } = await makeToken("u2@example.com");
    const p = await seedProduct();
    const cart2 = await testPrisma.cart.create({ data: { userId: u2.id } });
    await testPrisma.cartItem.create({ data: { cartId: cart2.id, productId: p.id, quantity: 1 } });

    const req = makeRequest("/api/cart", { token: t1 });
    const res = await getCart(req);
    const json = await res.json();
    expect(json.items).toEqual([]);
    void u1;
  });
});

describe("PATCH /api/cart/:itemId", () => {
  it("updates cart item quantity", async () => {
    const { user, token } = await makeToken();
    const p = await seedProduct();
    const cart = await testPrisma.cart.create({ data: { userId: user.id } });
    const item = await testPrisma.cartItem.create({ data: { cartId: cart.id, productId: p.id, quantity: 1 } });

    const req = makeRequest(`/api/cart/${item.id}`, {
      method: "PATCH",
      body: { quantity: 5 },
      token,
    });
    const res = await updateCartItem(req, { params: Promise.resolve({ itemId: String(item.id) }) });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.quantity).toBe(5);
  });

  it("cannot modify another user's cart item", async () => {
    const { user: u2 } = await makeToken("u2@example.com");
    const { token: t1 } = await makeToken("u1@example.com");
    const p = await seedProduct();
    const cart2 = await testPrisma.cart.create({ data: { userId: u2.id } });
    const item = await testPrisma.cartItem.create({ data: { cartId: cart2.id, productId: p.id, quantity: 1 } });

    const req = makeRequest(`/api/cart/${item.id}`, {
      method: "PATCH",
      body: { quantity: 3 },
      token: t1,
    });
    const res = await updateCartItem(req, { params: Promise.resolve({ itemId: String(item.id) }) });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/cart/:itemId", () => {
  it("removes item from cart", async () => {
    const { user, token } = await makeToken();
    const p = await seedProduct();
    const cart = await testPrisma.cart.create({ data: { userId: user.id } });
    const item = await testPrisma.cartItem.create({ data: { cartId: cart.id, productId: p.id, quantity: 1 } });

    const req = makeRequest(`/api/cart/${item.id}`, { method: "DELETE", token });
    const res = await deleteCartItem(req, { params: Promise.resolve({ itemId: String(item.id) }) });
    expect(res.status).toBe(204);
  });
});
