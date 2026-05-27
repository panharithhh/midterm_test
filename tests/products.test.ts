import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { GET as listProducts, POST as createProduct } from "@/app/api/products/route";
import { GET as getProduct, PUT as updateProduct, DELETE as deleteProduct } from "@/app/api/products/[id]/route";
import { resetDb, makeRequest, createUser, tokenFor, testPrisma } from "./helpers";

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await testPrisma.$disconnect(); });

async function makeAdmin() {
  const u = await createUser("admin@example.com", "password123", "admin");
  return tokenFor(u.id, u.role);
}

async function makeUserToken() {
  const u = await createUser("user@example.com", "password123", "user");
  return tokenFor(u.id, u.role);
}

async function seedProduct() {
  return testPrisma.product.create({
    data: { name: "Widget", price: 9.99, stock: 10 },
  });
}

describe("GET /api/products", () => {
  it("returns empty array when no products", async () => {
    const req = makeRequest("/api/products");
    const res = await listProducts(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual([]);
  });

  it("returns products list", async () => {
    await seedProduct();
    const req = makeRequest("/api/products");
    const res = await listProducts(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.length).toBe(1);
    expect(json[0].name).toBe("Widget");
  });

  it("filters by search query", async () => {
    await testPrisma.product.createMany({
      data: [
        { name: "Widget", price: 9.99, stock: 5 },
        { name: "Gadget", price: 19.99, stock: 5 },
      ],
    });
    const req = makeRequest("/api/products?search=Widget");
    const res = await listProducts(req);
    const json = await res.json();
    expect(json.length).toBe(1);
    expect(json[0].name).toBe("Widget");
  });

  it("filters by price range", async () => {
    await testPrisma.product.createMany({
      data: [
        { name: "Cheap", price: 5, stock: 5 },
        { name: "Expensive", price: 100, stock: 5 },
      ],
    });
    const req = makeRequest("/api/products?minPrice=10&maxPrice=50");
    const res = await listProducts(req);
    const json = await res.json();
    expect(json.length).toBe(0);
  });
});

describe("GET /api/products/:id", () => {
  it("returns product by id", async () => {
    const p = await seedProduct();
    const req = makeRequest(`/api/products/${p.id}`);
    const res = await getProduct(req, { params: Promise.resolve({ id: String(p.id) }) });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.id).toBe(p.id);
  });

  it("returns 404 for nonexistent product", async () => {
    const req = makeRequest("/api/products/9999");
    const res = await getProduct(req, { params: Promise.resolve({ id: "9999" }) });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/products", () => {
  it("admin can create a product", async () => {
    const token = await makeAdmin();
    const req = makeRequest("/api/products", {
      method: "POST",
      body: { name: "New Product", price: 29.99, stock: 5 },
      token,
    });
    const res = await createProduct(req);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.name).toBe("New Product");
  });

  it("regular user gets 403", async () => {
    const token = await makeUserToken();
    const req = makeRequest("/api/products", {
      method: "POST",
      body: { name: "New Product", price: 29.99 },
      token,
    });
    const res = await createProduct(req);
    expect(res.status).toBe(403);
  });

  it("unauthenticated request gets 401", async () => {
    const req = makeRequest("/api/products", {
      method: "POST",
      body: { name: "New Product", price: 29.99 },
    });
    const res = await createProduct(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    const token = await makeAdmin();
    const req = makeRequest("/api/products", {
      method: "POST",
      body: { name: "No Price" },
      token,
    });
    const res = await createProduct(req);
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/products/:id", () => {
  it("admin can update a product", async () => {
    const token = await makeAdmin();
    const p = await seedProduct();
    const req = makeRequest(`/api/products/${p.id}`, {
      method: "PUT",
      body: { name: "Updated Widget", price: 12.99 },
      token,
    });
    const res = await updateProduct(req, { params: Promise.resolve({ id: String(p.id) }) });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.name).toBe("Updated Widget");
  });

  it("returns 404 when product not found", async () => {
    const token = await makeAdmin();
    const req = makeRequest("/api/products/9999", {
      method: "PUT",
      body: { name: "Ghost" },
      token,
    });
    const res = await updateProduct(req, { params: Promise.resolve({ id: "9999" }) });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/products/:id", () => {
  it("admin can delete a product", async () => {
    const token = await makeAdmin();
    const p = await seedProduct();
    const req = makeRequest(`/api/products/${p.id}`, { method: "DELETE", token });
    const res = await deleteProduct(req, { params: Promise.resolve({ id: String(p.id) }) });
    expect(res.status).toBe(204);
  });

  it("returns 404 when product not found", async () => {
    const token = await makeAdmin();
    const req = makeRequest("/api/products/9999", { method: "DELETE", token });
    const res = await deleteProduct(req, { params: Promise.resolve({ id: "9999" }) });
    expect(res.status).toBe(404);
  });
});
