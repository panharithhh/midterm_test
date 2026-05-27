import { Router } from "express";
import { prisma } from "../lib/prisma";
import { cartAddSchema, cartUpdateSchema } from "../lib/validators";
import { requireAuth } from "../lib/auth";
import { errorResponse, handleRouteError } from "../lib/errors";

const router = Router();

async function getOwnedItem(userId: number, itemId: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return null;
  return prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
}

router.get("/", async (req, res) => {
  try {
    const user = requireAuth(req);
    const cart = await prisma.cart.findUnique({
      where: { userId: user.userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, stock: true } },
          },
        },
      },
    });
    res.json(cart ?? { items: [] });
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.post("/", async (req, res) => {
  try {
    const user = requireAuth(req);
    const parsed = cartAddSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, "Validation failed", 400, parsed.error.flatten());
    }
    const { productId, quantity } = parsed.data;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return errorResponse(res, "Product not found", 404);
    if (quantity > product.stock) return errorResponse(res, "Insufficient stock", 400);

    let cart = await prisma.cart.findUnique({ where: { userId: user.userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: user.userId } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    let item;
    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (newQty > product.stock) return errorResponse(res, "Insufficient stock", 400);
      item = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
        include: { product: { select: { id: true, name: true, price: true } } },
      });
    } else {
      item = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
        include: { product: { select: { id: true, name: true, price: true } } },
      });
    }

    res.status(201).json(item);
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.patch("/:itemId", async (req, res) => {
  try {
    const user = requireAuth(req);
    const parsed = cartUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return errorResponse(res, "Validation failed", 400, parsed.error.flatten());
    }

    const item = await getOwnedItem(user.userId, parseInt(req.params.itemId));
    if (!item) return errorResponse(res, "Cart item not found", 404);

    const updated = await prisma.cartItem.update({
      where: { id: parseInt(req.params.itemId) },
      data: { quantity: parsed.data.quantity },
      include: { product: { select: { id: true, name: true, price: true } } },
    });
    res.json(updated);
  } catch (err) {
    handleRouteError(err, res);
  }
});

router.delete("/:itemId", async (req, res) => {
  try {
    const user = requireAuth(req);
    const item = await getOwnedItem(user.userId, parseInt(req.params.itemId));
    if (!item) return errorResponse(res, "Cart item not found", 404);

    await prisma.cartItem.delete({ where: { id: parseInt(req.params.itemId) } });
    res.status(204).send();
  } catch (err) {
    handleRouteError(err, res);
  }
});

export default router;
