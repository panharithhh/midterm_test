import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inventorySchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/auth";
import { errorResponse, handleRouteError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = inventorySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    if (!product) return errorResponse("Product not found", 404);

    let newStock: number;
    if (parsed.data.stock !== undefined) {
      newStock = parsed.data.stock;
    } else {
      newStock = product.stock + (parsed.data.delta ?? 0);
    }

    if (newStock < 0) return errorResponse("Stock cannot be negative", 400);

    const updated = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { stock: newStock },
      select: { id: true, name: true, stock: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleRouteError(err);
  }
}
