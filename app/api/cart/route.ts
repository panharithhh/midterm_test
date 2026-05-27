import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cartAddSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";
import { errorResponse, handleRouteError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const cart = await prisma.cart.findUnique({
      where: { userId: user.userId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, stock: true },
            },
          },
        },
      },
    });
    if (!cart) return NextResponse.json({ items: [] });
    return NextResponse.json(cart);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const parsed = cartAddSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const { productId, quantity } = parsed.data;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return errorResponse("Product not found", 404);
    if (quantity > product.stock) return errorResponse("Insufficient stock", 400);

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
      if (newQty > product.stock) return errorResponse("Insufficient stock", 400);
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

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
