import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productUpdateSchema } from "@/lib/validators";
import { requireAdmin } from "@/lib/auth";
import { errorResponse, handleRouteError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, description: true, price: true, stock: true, createdAt: true },
    });
    if (!product) return errorResponse("Product not found", 404);
    return NextResponse.json(product);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const existing = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return errorResponse("Product not found", 404);

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: parsed.data,
      select: { id: true, name: true, description: true, price: true, stock: true, updatedAt: true },
    });
    return NextResponse.json(product);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const existing = await prisma.product.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return errorResponse("Product not found", 404);

    await prisma.product.delete({ where: { id: parseInt(id) } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}
