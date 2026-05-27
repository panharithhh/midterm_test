import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "admin"]).optional().default("user"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string().optional(),
  stock: z.number().int().min(0).optional().default(0),
});

export const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  description: z.string().optional(),
  stock: z.number().int().min(0).optional(),
});

export const inventorySchema = z.object({
  stock: z.number().int().optional(),
  delta: z.number().int().optional(),
}).refine((d) => d.stock !== undefined || d.delta !== undefined, {
  message: "Provide either stock or delta",
});

export const cartAddSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const cartUpdateSchema = z.object({
  quantity: z.number().int().positive(),
});
