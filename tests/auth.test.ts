import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { resetDb, makeRequest, createUser, testPrisma } from "./helpers";

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await testPrisma.$disconnect(); });

describe("POST /api/auth/register", () => {
  it("registers a new user successfully", async () => {
    const req = makeRequest("/api/auth/register", {
      method: "POST",
      body: { email: "test@example.com", password: "password123" },
    });
    const res = await register(req);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.email).toBe("test@example.com");
    expect(json.role).toBe("user");
    expect(json.password).toBeUndefined();
  });

  it("returns 409 on duplicate email", async () => {
    await createUser("dup@example.com", "password123");
    const req = makeRequest("/api/auth/register", {
      method: "POST",
      body: { email: "dup@example.com", password: "password123" },
    });
    const res = await register(req);
    expect(res.status).toBe(409);
  });

  it("returns 400 on invalid email format", async () => {
    const req = makeRequest("/api/auth/register", {
      method: "POST",
      body: { email: "not-an-email", password: "password123" },
    });
    const res = await register(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is too short", async () => {
    const req = makeRequest("/api/auth/register", {
      method: "POST",
      body: { email: "test@example.com", password: "abc" },
    });
    const res = await register(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when fields are missing", async () => {
    const req = makeRequest("/api/auth/register", {
      method: "POST",
      body: { email: "test@example.com" },
    });
    const res = await register(req);
    expect(res.status).toBe(400);
  });

  it("can register an admin user", async () => {
    const req = makeRequest("/api/auth/register", {
      method: "POST",
      body: { email: "admin@example.com", password: "adminpass", role: "admin" },
    });
    const res = await register(req);
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.role).toBe("admin");
  });
});

describe("POST /api/auth/login", () => {
  it("logs in and returns token", async () => {
    await createUser("user@example.com", "password123");
    const req = makeRequest("/api/auth/login", {
      method: "POST",
      body: { email: "user@example.com", password: "password123" },
    });
    const res = await login(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.token).toBeDefined();
    expect(json.user.email).toBe("user@example.com");
    expect(json.user.password).toBeUndefined();
  });

  it("returns 401 on wrong password", async () => {
    await createUser("user@example.com", "password123");
    const req = makeRequest("/api/auth/login", {
      method: "POST",
      body: { email: "user@example.com", password: "wrongpassword" },
    });
    const res = await login(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when user not found", async () => {
    const req = makeRequest("/api/auth/login", {
      method: "POST",
      body: { email: "nobody@example.com", password: "password123" },
    });
    const res = await login(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when fields are missing", async () => {
    const req = makeRequest("/api/auth/login", {
      method: "POST",
      body: { email: "user@example.com" },
    });
    const res = await login(req);
    expect(res.status).toBe(400);
  });
});
