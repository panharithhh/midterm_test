import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cartUpdateSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";
import { errorResponse, handleRouteError } from "@/lib/errors";

type Params = { params: Promise<{ itemId: string }> };

async function getOwnedItem(userId: number, itemId: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return null;
  return prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    const { itemId } = await params;
    const body = await req.json();
    const parsed = cartUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const item = await getOwnedItem(user.userId, parseInt(itemId));
    if (!item) return errorResponse("Cart item not found", 404);

    const updated = await prisma.cartItem.update({
      where: { id: parseInt(itemId) },
      data: { quantity: parsed.data.quantity },
      include: { product: { select: { id: true, name: true, price: true } } },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = requireAuth(req);
    const { itemId } = await params;
    const item = await getOwnedItem(user.userId, parseInt(itemId));
    if (!item) return errorResponse("Cart item not found", 404);

    await prisma.cartItem.delete({ where: { id: parseInt(itemId) } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}
