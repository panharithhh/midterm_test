import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PATCH as patchInventory } from "@/app/api/inventory/[id]/route";
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

async function seedProduct(stock = 10) {
  return testPrisma.product.create({ data: { name: "Item", price: 5.0, stock } });
}

describe("PATCH /api/inventory/:id", () => {
  it("sets stock using absolute value", async () => {
    const token = await makeAdmin();
    const p = await seedProduct(10);
    const req = makeRequest(`/api/inventory/${p.id}`, {
      method: "PATCH",
      body: { stock: 50 },
      token,
    });
    const res = await patchInventory(req, { params: Promise.resolve({ id: String(p.id) }) });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.stock).toBe(50);
  });

  it("adjusts stock using delta", async () => {
    const token = await makeAdmin();
    const p = await seedProduct(10);
    const req = makeRequest(`/api/inventory/${p.id}`, {
      method: "PATCH",
      body: { delta: 5 },
      token,
    });
    const res = await patchInventory(req, { params: Promise.resolve({ id: String(p.id) }) });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.stock).toBe(15);
  });

  it("blocks negative final stock", async () => {
    const token = await makeAdmin();
    const p = await seedProduct(5);
    const req = makeRequest(`/api/inventory/${p.id}`, {
      method: "PATCH",
      body: { delta: -10 },
      token,
    });
    const res = await patchInventory(req, { params: Promise.resolve({ id: String(p.id) }) });
    expect(res.status).toBe(400);
  });

  it("returns 403 for non-admin", async () => {
    const token = await makeUserToken();
    const p = await seedProduct();
    const req = makeRequest(`/api/inventory/${p.id}`, {
      method: "PATCH",
      body: { stock: 20 },
      token,
    });
    const res = await patchInventory(req, { params: Promise.resolve({ id: String(p.id) }) });
    expect(res.status).toBe(403);
  });

  it("returns 404 when product not found", async () => {
    const token = await makeAdmin();
    const req = makeRequest("/api/inventory/9999", {
      method: "PATCH",
      body: { stock: 10 },
      token,
    });
    const res = await patchInventory(req, { params: Promise.resolve({ id: "9999" }) });
    expect(res.status).toBe(404);
  });
});
