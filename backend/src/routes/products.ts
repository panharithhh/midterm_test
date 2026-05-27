import { Router } from "express";
import { prisma } from "../lib/prisma";
import { productSchema, productUpdateSchema } from "../lib/validators";
import { requireAdmin } from "../lib/auth";
import { errorResponse, handleRouteError } from "../lib/errors";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const search = (req.query.search as string) ?? "";
    const minPrice = parseFloat((req.query.minPrice as string) ?? "0");
    const maxPrice = parseFloat((req.query.maxPrice as string) ?? "999999999");

    const products = await prisma.product.findMany({
      where: {
        name: search ? { contains: search } : undefined,
        price: {
          gte: isNaN(minPrice) ? 0 : minPrice,
          lte: isNaN(maxPrice) ? 999999999 : maxPrice,
        },
      },
      select: { id: true, name: true, description: true, price: true, stock: true, createdAt: true },
    });
    res.json(products);
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, name: true, description: true, price: true, stock: true, createdAt: true },
    });
    if (!product) return errorResponse(res, "Product not found", 404);
    res.json(product);
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.post("/", async (req, res) => {
  try {
    requireAdmin(req);
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, "Validation failed", 400, parsed.error.flatten());
    }
    const product = await prisma.product.create({
      data: parsed.data,
      select: { id: true, name: true, description: true, price: true, stock: true, createdAt: true },
    });
    res.status(201).json(product);
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.put("/:id", async (req, res) => {
  try {
    requireAdmin(req);
    const parsed = productUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, "Validation failed", 400, parsed.error.flatten());
    }
    const existing = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) return errorResponse(res, "Product not found", 404);

    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: parsed.data,
      select: { id: true, name: true, description: true, price: true, stock: true, updatedAt: true },
    });
    res.json(product);
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    requireAdmin(req);
    const existing = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) return errorResponse(res, "Product not found", 404);

    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    handleRouteError(err, res);
  }
});

export default router;
