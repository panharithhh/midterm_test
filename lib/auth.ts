import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export interface JwtPayload {
  userId: number;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function getUserFromRequest(req: NextRequest): JwtPayload | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  try {
    return verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

export function requireAuth(req: NextRequest): JwtPayload {
  const user = getUserFromRequest(req);
  if (!user) throw { status: 401, message: "Unauthorized" };
  return user;
}

export function requireAdmin(req: NextRequest): JwtPayload {
  const user = requireAuth(req);
  if (user.role !== "admin") throw { status: 403, message: "Forbidden" };
  return user;
}
