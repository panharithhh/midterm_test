import jwt from "jsonwebtoken";
import { Request } from "express";

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

export function getUserFromRequest(req: Request): JwtPayload | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  try {
    return verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

export function requireAuth(req: Request): JwtPayload {
  const user = getUserFromRequest(req);
  if (!user) throw { status: 401, message: "Unauthorized" };
  return user;
}

export function requireAdmin(req: Request): JwtPayload {
  const user = requireAuth(req);
  if (user.role !== "admin") throw { status: 403, message: "Forbidden" };
  return user;
}
