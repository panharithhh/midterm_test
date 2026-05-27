import { Router } from "express";
import { prisma } from "../lib/prisma";
import { inventorySchema } from "../lib/validators";
import { requireAdmin } from "../lib/auth";
import { errorResponse, handleRouteError } from "../lib/errors";

const router = Router();

router.patch("/:id", async (req, res) => {
  try {
    requireAdmin(req);
    const parsed = inventorySchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, "Validation failed", 400, parsed.error.flatten());
    }

    const product = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!product) return errorResponse(res, "Product not found", 404);

    let newStock: number;
    if (parsed.data.stock !== undefined) {
      newStock = parsed.data.stock;
    } else {
      newStock = product.stock + (parsed.data.delta ?? 0);
    }

    if (newStock < 0) return errorResponse(res, "Stock cannot be negative", 400);

    const updated = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { stock: newStock },
      select: { id: true, name: true, stock: true },
    });
    res.json(updated);
  } catch (err) {
    handleRouteError(err, res);
  }
});

export default router;
