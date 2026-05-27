import { NextRequest } from "next/server";
import { signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const testPrisma = prisma;

export async function resetDb() {
  await testPrisma.cartItem.deleteMany();
  await testPrisma.cart.deleteMany();
  await testPrisma.product.deleteMany();
  await testPrisma.user.deleteMany();
}

export function makeRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
  } = {}
): NextRequest {
  const { method = "GET", body, token } = options;
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function createUser(
  email: string,
  password: string,
  role = "user"
) {
  const bcrypt = await import("bcryptjs");
  const hashed = await bcrypt.hash(password, 10);
  return testPrisma.user.create({ data: { email, password: hashed, role } });
}

export function tokenFor(userId: number, role: string) {
  return signToken({ userId, role });
}
